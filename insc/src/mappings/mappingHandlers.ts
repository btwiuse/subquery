import {
  SubstrateExtrinsic,
  SubstrateEvent,
  SubstrateBlock,
} from "@subql/types";
import { Account, Transfer, Token } from "../types";
import { Balance } from "@polkadot/types/interfaces";
import { decodeAddress } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";

export async function handleBlock(block: SubstrateBlock): Promise<void> {
  // Do something with each block handler here
}

export async function handleCall(extrinsic: SubstrateExtrinsic): Promise<void> {
  // Do something with a call handler here
}

export async function handleEvent(event: SubstrateEvent): Promise<void> {
  logger.info(
    `New transfer event found at block ${event.block.block.header.number.toString()}`
  );

  // Get data from the event
  // The balances.transfer event has the following payload \[from, to, value\]
  // logger.info(JSON.stringify(event));
  const {
    event: {
      data: [from, to, amount],
    },
  } = event;

  const blockNumber: number = event.block.block.header.number.toNumber();

  const fromAccount = await checkAndGetAccount(from.toString(), blockNumber);
  const toAccount = await checkAndGetAccount(to.toString(), blockNumber);

  // Create the new transfer entity
  const transfer = Transfer.create({
    id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
    blockNumber,
    date: event.block.timestamp,
    fromId: fromAccount.id,
    toId: toAccount.id,
    amount: (amount as Balance).toBigInt(),
  });

  fromAccount.lastTransferBlock = blockNumber;
  toAccount.lastTransferBlock = blockNumber;

  await Promise.all([fromAccount.save(), toAccount.save(), transfer.save()]);
}

async function checkAndGetAccount(
  id: string,
  blockNumber: number
): Promise<Account> {
  let account = await Account.get(id.toLowerCase());
  if (!account) {
    // We couldn't find the account
    account = Account.create({
      id: id.toLowerCase(),
      publicKey: decodeAddress(id).toString().toLowerCase(),
      firstTransferBlock: blockNumber,
    });
  }
  return account;
}

function hexToString(hexString: string) {
  const hexWithoutPrefix = hexString.substring(2); // Remove the '0x' prefix
  const hexPairs = hexWithoutPrefix.match(/.{1,2}/g); // Split the string into pairs of characters

  const string = hexPairs!.map(hexPair => String.fromCharCode(parseInt(hexPair, 16))).join("");

  return string;
}

export async function handleRemark(event: SubstrateEvent): Promise<void> {
  const {
    event: { data },
    extrinsic,
  } = event;
  if (!extrinsic!.success || data.length < 2) return;
  logger.info(`System::remarked data length: ${data.length}`);
  data.map((x, i) => {
    logger.info(`- ${data[i].toString()}`)
  })

  logger.info(extrinsic?.extrinsic.method.section) // "system"
  logger.info(extrinsic?.extrinsic.method.method) // "remarkWithEvent"

  if (extrinsic?.extrinsic.method.section != "system") {
    logger.info(`ignoring batch call`)
    return
  }

  let line = hexToString(extrinsic?.extrinsic.args[0].toString())
  let parts = line.split(' ')
  logger.info(JSON.stringify(parts))
  let action = parts[0]

  switch (action) {
    case "INSC::DEPLOY":
      let [, tick, totalSupply, mintLimit] = parts
      await handleDeploy(tick, Number(totalSupply), Number(mintLimit))
      return
    /*
    case "INSC::MINT":
      await handleMint(parts)
      return
    case "INSC::SEND":
      await handleTransfer(parts)
      return
    */
    default:
      return
  }
}


async function handleDeploy(tick: string, totalSupply: number, mintLimit: number) {
  const token = new Token(tick)
  token.tick = tick;
  token.totalSupply = totalSupply;
  token.mintLimit = mintLimit;
  await token.save()
}