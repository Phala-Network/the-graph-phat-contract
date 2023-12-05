import { expect } from "chai";
import { type Contract, type Event } from "ethers";
import { ethers } from "hardhat";
import { execSync } from "child_process";

async function waitForResponse(consumer: Contract, event: Event) {
  const [, data] = event.args!;
  // Run Phat Function
  const result = execSync(`phat-fn run --json dist/index.js -a ${data} '{"apiUrl": "https://gateway.thegraph.com/api/", "apiKey": "cd22a01e5b7f9828cddcb52caf03ee79"}'`).toString();
  const json = JSON.parse(result);
  const action = ethers.utils.hexlify(ethers.utils.concat([
    new Uint8Array([0]),
    json.output,
  ]));
  // Make a response
  const tx = await consumer.rollupU256CondEq(
    // cond
    [],
    [],
    // updates
    [],
    [],
    // actions
    [action],
  );
  const receipt = await tx.wait();
  return receipt.events;
}

describe("OracleConsumerContract.sol", function () {
  it("Push and receive message", async function () {
    // Deploy the contract
    const [deployer] = await ethers.getSigners();
    const TestOracleConsumerContract = await ethers.getContractFactory("OracleConsumerContract");
    const consumer = await TestOracleConsumerContract.deploy(deployer.address);

    // Make a request
    const accountId = "0x011c23b3aadaf3d4991f3abee262a34d18e9fdb5";
    const tx = await consumer.request(accountId);
    const receipt = await tx.wait();
    const reqEvents = receipt.events;
    expect(reqEvents![0]).to.have.property("event", "MessageQueued");

    // Wait for Phat Contract response
    const respEvents = await waitForResponse(consumer, reqEvents![0])

    // Check response data
    expect(respEvents[0]).to.have.property("event", "ResponseReceived");
    const [reqId, target, value] = respEvents[0].args;
    expect(ethers.BigNumber.isBigNumber(reqId)).to.be.true;
    expect(target.toLowerCase()).to.equal(accountId);
    expect(ethers.BigNumber.isBigNumber(value)).to.be.true;
  });
});
