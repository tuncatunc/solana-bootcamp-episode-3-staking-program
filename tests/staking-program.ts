import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StakingProgram } from "../target/types/staking_program";
import { Connection, PublicKey } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

describe("staking-program", () => {
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as anchor.Wallet;
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);
  const payer = wallet.payer;
  const connection = new Connection("http://localhost:8899", "confirmed");
  // const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const mintKeypair = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array([
      218, 141, 66, 223, 219, 158, 136, 95, 57, 86, 247,
      214, 208, 191, 102, 161, 162, 187, 40, 43, 68, 130,
      18, 178, 98, 21, 137, 39, 95, 25, 52, 193, 181,
      153, 238, 10, 227, 255, 205, 217, 123, 247, 165, 103,
      208, 198, 165, 27, 89, 66, 176, 45, 139, 53, 87,
      207, 131, 212, 124, 153, 172, 233, 51, 145]),
  )

  const program = anchor.workspace.StakingProgram as Program<StakingProgram>;

  async function createMintToken() {
    const mint = await createMint(
      connection,
      wallet.payer,
      wallet.payer.publicKey,
      null,
      9,
      mintKeypair
    );
    console.log("Mint Address", mint);
  }

  it("Is initialized!", async () => {
    // Add your test here.
    // await createMintToken();
    let [vaultAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    );

    const tx = await program.methods.initialize()
      .accounts({
        mint: mintKeypair.publicKey,
        signer: payer.publicKey,
        tokenVaultAccount: vaultAccount,
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("stake", async () => {
    let userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      mintKeypair.publicKey,
      wallet.payer.publicKey
    );

    await mintTo(
      connection,
      wallet.payer,
      mintKeypair.publicKey,
      userTokenAccount.address,
      wallet.payer,
      1e11
    );

    let [stakeInfo] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_info"), wallet.payer.publicKey.toBuffer()],
      program.programId
    );

    let [stakeAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("token"), payer.publicKey.toBuffer()],
      program.programId
    );

    await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      mintKeypair.publicKey,
      payer.publicKey
    );

    let [vaultAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    );



    const tx = await program.methods
      .stake(new anchor.BN(1))
      .signers([wallet.payer])
      .accounts({
        stakeInfoAccount: stakeInfo,
        stakeAccount: stakeAccount,
        userTokenAccount: userTokenAccount.address,
        mint: mintKeypair.publicKey,
        signer: wallet.payer.publicKey,
      })
      .rpc();

    console.log("Your transaction signature", tx);
  })
});
