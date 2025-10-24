

import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Voting } from '../target/types/voting'
const IDL = require('../target/idl/voting.json')
import { BankrunProvider ,startAnchor} from 'anchor-bankrun';
//import { startAnchor } from 'solana-bankrun';
import { PublicKey } from '@solana/web3.js';

describe('Voting', () => {
 let context;
 let provider;
 anchor.setProvider(anchor.AnchorProvider.env());
//  let votingProgram:any;
let votingProgram = anchor.workspace.Voting as Program<Voting>;
 beforeAll(async()=>{
  // context = await startAnchor("",[{name:"voting",programId:votingAddress}],[]);
  // provider = new BankrunProvider(context);
  // votingProgram = new Program<Voting>(IDL, provider);
 })

 
 const votingAddress = new PublicKey("HjtYhrJ8edmGLmdmX9inEA1EK3oaVMHLHTLjwAqBfJX7")

  it('Initialize Poll', async () => {
  //  const context = await startAnchor("",[{name:"voting",programId:votingAddress}],[]);
  //  const provider = new BankrunProvider(context);
  //  const votingProgram = new Program<Voting>(IDL, provider);

   await votingProgram.methods.initializePoll(
    new anchor.BN(1),
    "What is your favorite type of peanut butter flavor?",
    new anchor.BN(0),
    new anchor.BN(1860008680)

   ).rpc();

     const [pollAddress] = PublicKey.findProgramAddressSync(
    [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)  ], // poll_id 1 as bytes
    votingAddress
   );

   const poll = await votingProgram.account.poll.fetch(pollAddress);
   console.log("Poll Address: ", pollAddress.toBase58());
   console.log("Poll Data: ", poll);
   
   expect(poll.pollId.toNumber()).toEqual(1);
   expect(poll.description).toEqual("What is your favorite type of peanut butter flavor?");
   expect(poll.pollStart.toNumber()).toEqual(0);
   expect(poll.pollEnd.toNumber()).toEqual(1860008680);
   expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());

  })

  it('Initialize Candidate', async () => {

    await votingProgram.methods.initializeCandidate(
      "Smooth",
      new anchor.BN(1)
    ).rpc();
    await votingProgram.methods.initializeCandidate(
      "Crunchy",
      new anchor.BN(1)
    ).rpc();

    const [crunchyCandidateAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Crunchy")],
      votingProgram.programId
    );
    const crunchyCandidate = await votingProgram.account.candidate.fetch(crunchyCandidateAddress);
    console.log("Crunchy Candidate Address: ", crunchyCandidateAddress.toBase58());
    console.log("Crunchy Candidate Data: ", crunchyCandidate);
   expect(crunchyCandidate.candidateName).toEqual("Crunchy");
    expect(crunchyCandidate.candidateVotes.toNumber()).toEqual(0);
    
    
    const [SmoothCandidateAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Smooth")],
      votingProgram.programId
    );

    const smoothCandidate = await votingProgram.account.candidate.fetch(SmoothCandidateAddress);
    console.log("Smooth Candidate Address: ", SmoothCandidateAddress.toBase58());
    console.log("Smooth Candidate Data: ", smoothCandidate);
   expect(smoothCandidate.candidateVotes.toNumber()).toEqual(0);
    expect(smoothCandidate.candidateName).toEqual("Smooth");

  });

  it('vote', async () => {
    await votingProgram.methods.vote(
      "Smooth",
      new anchor.BN(1)
    ).rpc()

     const [SmoothCandidateAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Smooth")],
      votingProgram.programId
    );
    const smoothCandidate = await votingProgram.account.candidate.fetch(SmoothCandidateAddress);
    console.log("Smooth Candidate Address: ", SmoothCandidateAddress.toBase58());
    console.log("Smooth Candidate Data: ", smoothCandidate);
   expect(smoothCandidate.candidateVotes.toNumber()).toEqual(1);
    expect(smoothCandidate.candidateName).toEqual("Smooth");
  });
})
