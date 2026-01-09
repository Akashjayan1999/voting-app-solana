'use client';

import { getVotingProgram, getVotingProgramId } from '@project/anchor'
import { Program, BN } from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Cluster, PublicKey,ComputeBudgetProgram,Transaction } from '@solana/web3.js';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { useCluster } from '../cluster/cluster-data-access';
import { useAnchorProvider } from '../solana/solana-provider';
import { useTransactionToast } from '../ui/ui-layout';


export function useVotingProgramCandidateAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster();
  const provider = useAnchorProvider();
  const program = getVotingProgram(provider);
  const transactionToast = useTransactionToast();
  const { connection } = useConnection();
  const {publicKey,sendTransaction} = useWallet();

  const candidateQuery = useQuery({
    queryKey: ['candidate', { cluster, account }],
    queryFn: () => program.account.candidate.fetch(account),
  });

  const vote = useMutation({
    mutationKey: ['voting', 'vote', { cluster }],
    mutationFn: async(candidate: string) =>{
      const modifyComputeUnit = ComputeBudgetProgram.setComputeUnitLimit({
     units: 8000
      })
  // Set priority fee (1 microLamports per compute unit)
  let recentPrioritizationFees = await connection.getRecentPrioritizationFees({
    lockedWritableAccounts: [new PublicKey(candidate)],
  });

  const minFee = Math.min(...recentPrioritizationFees.map(feeInfo => feeInfo.prioritizationFee));

  const modifyPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: minFee+1
  })
     const vote = await program.methods.vote(
        candidate,
        new BN(1),
      ).instruction();
      const blockhashContext = await connection.getLatestBlockhashAndContext();
      const tx = new Transaction({
        feePayer: publicKey,
        blockhash: blockhashContext.value.blockhash,
        lastValidBlockHeight: blockhashContext.value.lastValidBlockHeight,
      }).add(modifyComputeUnit).add(modifyPriorityFee).add(vote);

      return await sendTransaction(tx, connection);
    },
      onSuccess: (signature) => {
        transactionToast(signature);
        return candidateQuery.refetch();
      },
      onError: () => toast.error('Failed to vote for candidate'),
  });

  return {
    candidateQuery,
    vote
  }
}

export function useVotingProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const programId = useMemo(
    () => getVotingProgramId(cluster.network as Cluster),
    [cluster]
  );
  const program = getVotingProgram(provider);

  const accounts = useQuery({
    queryKey: ['voting', 'all', { cluster }],
    queryFn: () => program.account.candidate.all(),
  });

  const polls = useQuery({
    queryKey: ['polls', 'all', { cluster }],
    queryFn: () => program.account.poll.all(),
  });

  const candidates = useQuery({
    queryKey: ['candidates', 'all', { cluster }],
    queryFn: () => program.account.candidate.all(),
  });

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  const vote = useMutation({
    mutationKey: ['voting', 'vote', { cluster }],
    mutationFn: (candidate: string) =>
      program.methods.vote(
        candidate,
        new BN(1),
      ).rpc(),
      onSuccess: (signature) => {
        transactionToast(signature);
        return accounts.refetch();
      },
      onError: () => toast.error('Failed to vote for candidate'),
  });

  return {
    program,
    programId,
    accounts,
    polls,
    getProgramAccount,
    vote,
    candidates
  };
}