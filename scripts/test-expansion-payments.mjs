import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import solc from 'solc';
import { createPublicClient, createWalletClient, custom, parseEther, zeroAddress } from 'viem';
// Use a temporary runner install so Hardhat is never added to the website bundle.
// npm install --prefix /tmp/itties-payment-tests hardhat@3.21.1 --no-audit --no-fund
// node scripts/test-expansion-payments.mjs /tmp/itties-payment-tests/node_modules/hardhat/dist/src/hre.js
const { createHardhatRuntimeEnvironment } = await import(process.argv[2] ? pathToFileURL(path.resolve(process.argv[2])).href : 'hardhat/hre');
const mock = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract PaymentToken is ERC20 {
 uint8 immutable units; bool immutable taxed;
 constructor(uint8 d, bool t) ERC20("Community Token", "COMM") { units=d; taxed=t; }
 function decimals() public view override returns(uint8) { return units; }
 function mint(address to,uint256 n) external { _mint(to,n); }
 function _update(address from,address to,uint256 n) internal override {
  if(taxed && from!=address(0) && to!=address(0)) { uint256 fee=n/10; super._update(from,address(0),fee); super._update(from,to,n-fee); }
  else super._update(from,to,n);
 }
}`;
const file = 'IttiesExpansionPacks.sol';
const compiled = JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{[file]:{content:fs.readFileSync(`contracts/${file}`,'utf8')},'PaymentToken.sol':{content:mock}},settings:{optimizer:{enabled:true,runs:500},evmVersion:'cancun',outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}}),{import:p=>({contents:fs.readFileSync(path.join('node_modules',p),'utf8')})}));
assert.deepEqual((compiled.errors||[]).filter(e=>e.severity==='error'),[]);
const hre = await createHardhatRuntimeEnvironment({networks:{local:{type:'edr-simulated',chainId:8453,hardfork:'cancun'}}});
const connection = await hre.network.create('local');
const provider = connection.provider;
const chain={id:8453,name:'Local Base',nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:{default:{http:['http://localhost']}}};
const publicClient=createPublicClient({transport:custom(provider),chain});
const accounts=await provider.request({method:'eth_accounts',params:[]});
const [owner,buyer,treasury,outsider]=accounts;
const wallet=account=>createWalletClient({account,transport:custom(provider),chain});
const receipt=async hash=>{const r=await publicClient.waitForTransactionReceipt({hash});assert.equal(r.status,'success');return r;};
async function deploy(source,name,args=[]) {const c=compiled.contracts[source][name];const r=await receipt(await wallet(owner).deployContract({abi:c.abi,bytecode:`0x${c.evm.bytecode.object}`,args,gas:10000000n}));return {address:r.contractAddress,abi:c.abi};}
async function write(c,fn,args=[],account=owner) {await publicClient.simulateContract({...c,account,functionName:fn,args});return receipt(await wallet(account).writeContract({...c,functionName:fn,args,gas:2000000n}));}
const read=(c,fn,args=[])=>publicClient.readContract({...c,functionName:fn,args});
async function fails(c,fn,args=[],account=buyer){await assert.rejects(()=>publicClient.simulateContract({...c,account,functionName:fn,args}));}
let checks=0;const check=name=>{checks++;console.log(`PASS ${name}`);};
try {
const king=await deploy('PaymentToken.sol','PaymentToken',[18,false]);const queen=await deploy('PaymentToken.sol','PaymentToken',[18,false]);const community=await deploy('PaymentToken.sol','PaymentToken',[6,false]);const second=await deploy('PaymentToken.sol','PaymentToken',[18,false]);const taxed=await deploy('PaymentToken.sol','PaymentToken',[6,true]);
const packs=await deploy(file,'IttiesExpansionPacks',[king.address,queen.address,treasury,treasury]);
for(const t of [king,queen,second])await write(t,'mint',[buyer,parseEther('1000')]);
for(const t of [community,taxed])await write(t,'mint',[buyer,1000000000n]);
await write(packs,'createPack',['Regular','ipfs://regular',parseEther('150'),parseEther('150'),10,0,false]);
await write(packs,'createCommunityPack',['PEPE','ipfs://pepe',community.address,2500000n,10,3]);
assert.equal((await read(packs,'communityPayment',[1n]))[0],zeroAddress);assert.equal((await read(packs,'communityPayment',[2n]))[1],2500000n);check('regular and community configurations remain separate');
await fails(packs,'createCommunityPack',['Fake','ipfs://fake',zeroAddress,1n,10,0],owner);await fails(packs,'createCommunityPack',['Fake','ipfs://fake',outsider,1n,10,0],owner);await fails(packs,'createCommunityPack',['Fake','ipfs://fake',community.address,0n,10,0],owner);await fails(packs,'createCommunityPack',['Fake','ipfs://fake',community.address,1n,10,0],outsider);check('reject invalid tokens, zero prices, unauthorized creation');
await fails(packs,'buyCommunityExpansion',[2n,1n,community.address,2500000n]);check('community allowance required');
await write(community,'approve',[packs.address,100000000n],buyer);
await write(packs,'buyCommunityExpansion',[2n,2n,community.address,2500000n],buyer);
assert.equal(await read(community,'balanceOf',[treasury]),5000000n);assert.equal(await read(king,'balanceOf',[treasury]),0n);assert.equal(await read(queen,'balanceOf',[treasury]),0n);assert.equal(await read(packs,'balanceOf',[buyer,2n]),2n);check('6-decimal community payment goes only to treasury, quantity multiplies exactly');
await fails(packs,'buyExpansion',[2n,1n]);await fails(packs,'buyCommunityExpansion',[1n,1n,community.address,2500000n]);await fails(packs,'buyCommunityExpansion',[2n,1n,king.address,2500000n]);check('wrong payment routes and tokens cannot bypass payment');
await fails(packs,'buyCommunityExpansion',[2n,0n,community.address,2500000n]);await fails(packs,'buyCommunityExpansion',[2n,2n,community.address,2500000n]);check('zero quantity and supply cap rejected');
await write(packs,'setCommunityPrice',[2n,3000000n]);await fails(packs,'buyCommunityExpansion',[2n,1n,community.address,2500000n]);await fails(packs,'setCommunityPrice',[2n,1n],outsider);await fails(packs,'setCommunityPrice',[1n,1n],owner);check('stale quote rejected; only owner can update community price');
await write(packs,'pause');await fails(packs,'buyCommunityExpansion',[2n,1n,community.address,3000000n]);await write(packs,'unpause');await write(packs,'setPackActive',[2n,false]);await fails(packs,'buyCommunityExpansion',[2n,1n,community.address,3000000n]);await write(packs,'setPackActive',[2n,true]);check('pause and inactive guards apply to community purchases');
await write(packs,'buyCommunityExpansion',[2n,1n,community.address,3000000n],buyer);assert.equal(await read(community,'balanceOf',[treasury]),8000000n);await fails(packs,'buyCommunityExpansion',[2n,1n,community.address,3000000n]);check('fresh price works; sold-out pack rejects further purchases');
await write(king,'approve',[packs.address,parseEther('300')],buyer);await fails(packs,'buyExpansion',[1n,1n]);assert.equal(await read(king,'balanceOf',[treasury]),0n);await write(queen,'approve',[packs.address,parseEther('300')],buyer);await write(packs,'buyExpansion',[1n,2n],buyer);assert.equal(await read(king,'balanceOf',[treasury]),parseEther('300'));assert.equal(await read(queen,'balanceOf',[treasury]),parseEther('300'));check('regular purchases require BOTH KING and QUEEN; failed payment rolls back');
await write(packs,'createCommunityPack',['TOSHI','ipfs://toshi',second.address,parseEther('5'),10,0]);await write(second,'approve',[packs.address,parseEther('5')],buyer);await write(packs,'buyCommunityExpansion',[3n,1n,second.address,parseEther('5')],buyer);assert.equal(await read(second,'balanceOf',[treasury]),parseEther('5'));assert.equal(await read(community,'balanceOf',[treasury]),8000000n);check('different communities retain independent payment tokens and decimals');
await write(packs,'createCommunityPack',['Taxed','ipfs://tax',taxed.address,1000000n,10,0]);await write(taxed,'approve',[packs.address,1000000n],buyer);await fails(packs,'buyCommunityExpansion',[4n,1n,taxed.address,1000000n]);assert.equal(await read(taxed,'balanceOf',[treasury]),0n);assert.equal(await read(packs,'balanceOf',[buyer,4n]),0n);check('fee-on-transfer tokens rejected without partial payment or mint');
await write(packs,'safeTransferFrom',[buyer,outsider,2n,1n,'0x'],buyer);assert.equal(await read(packs,'balanceOf',[outsider,2n]),1n);await write(packs,'setIttiesCore',[owner]);await fails(packs,'burnForBinding',[outsider,1n,2n],buyer);await write(packs,'burnForBinding',[outsider,1n,2n]);assert.equal(await read(packs,'balanceOf',[outsider,2n]),0n);check('unbound trading and core-only binding burn preserved');
console.log(`${checks} payment checks passed.`);
} finally {await connection.close();}
