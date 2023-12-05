import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const OracleConsumerContract = await ethers.getContractFactory("OracleConsumerContract");

  const [deployer] = await ethers.getSigners();

  const consumerSC = process.env["LOCALHOST_CONSUMER_CONTRACT_ADDRESS"] || "";
  if (!consumerSC) {
    console.error("Error: Please provide LOCALHOST_CONSUMER_CONTRACT_ADDRESS");
    process.exit(1);
  }
  const consumer = OracleConsumerContract.attach(consumerSC);
  console.log("Pushing a request...");
  await consumer.connect(deployer).request("0x011c23b3aadaf3d4991f3abee262a34d18e9fdb5");
  consumer.on("ResponseReceived", async (reqId: number, target: string, value: string) => {
    console.info("Received event [ResponseReceived]:", {
      reqId,
      target,
      value,
    });
    process.exit();
  });
  consumer.on("ErrorReceived", async (reqId: number, target: string, value: string) => {
    console.info("Received event [ErrorReceived]:", {
      reqId,
      target,
      value,
    });
    process.exit();
  });

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
