import axios from 'axios'
import type { NextPage } from 'next'
import Head from 'next/head'
import React, { useEffect, useState } from 'react'
import { SubgraphIndexingStatus } from './api/status'

const Home: NextPage = () => {
  // autofocus input, see https://reactjs.org/docs/hooks-reference.html#useref
  const inputElement = React.useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (inputElement.current) {
      inputElement.current.focus()
    }
  }, [])

  const [subgraphID, setSubgraphID] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<SubgraphIndexingStatus | null>(null)
  const validSubgraphID = subgraphID.length === 46

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const { data } = await axios.get(`api/status?subgraphID=${subgraphID}`)
        setStatus(data.data)
      } catch (error: any) {
        setStatus(null)
      }
      setLoading(false)
    }
    if (validSubgraphID) {
      fetchData()
    }
  }, [subgraphID])

  function handteChange(event: React.FormEvent<HTMLInputElement>) {
    setSubgraphID(event.currentTarget.value)
  }

  return (
    <div className="flex min-h-screen flex-col items-center font-mono">
      <Head>
        <title>okgraph</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex w-full flex-1 items-center sm:w-3/5 lg:w-2/5">
        <div className="w-full">
          <div className=" text-center">
            <p className="text-6xl font-bold text-purple-600">okgraph</p>
          </div>
          <input
            type="text"
            className="form-control relative my-5 block w-full min-w-0 flex-auto rounded border border-solid border-purple-600 bg-white px-3 py-1.5 text-center text-base font-normal text-gray-700 outline-none"
            placeholder="Subgraph ID"
            aria-label="Search"
            aria-describedby="button-addon2"
            value={subgraphID}
            onChange={handteChange}
            ref={inputElement}
          />
          <Display subgraphID={subgraphID} loading={loading} status={status} />
        </div>
      </main>

      <footer className="flex h-20 w-full flex-col items-center justify-center border-t">
        <div>
          by{' '}
          <a className="underline" href="https://twitter.com/_0xbe1">
            0xbe1
          </a>{' '}
          |{' '}
          <a className="underline" href="https://github.com/0xbe1/okgraph">
            Code
          </a>{' '}
          <a className="underline" href="https://discord.gg/u5KUjNZ8wy">
            Community
          </a>
        </div>
        <div>
          <a className="underline" href="https://miniscan.xyz">
            miniscan.xyz
          </a>{' '}
          |{' '}
          <a className="underline" href="https://theybuidt.xyz">
            theybuidt.xyz
          </a>{' '}
          |{' '}
          <a className="text-purple-600 underline" href="https://okgraph.xyz">
            okgraph.xyz
          </a>{' '}
          |{' '}
          <a className="underline" href="https://name3.org">
            name3.org
          </a>
        </div>
      </footer>
    </div>
  )
}

export default Home

function Display({
  subgraphID,
  loading,
  status,
}: {
  subgraphID: string
  loading: boolean
  status: SubgraphIndexingStatus | null
}) {
  if (subgraphID.length === 0) {
    return (
      <p className="text-center">
        Tired of{' '}
        <a
          className="underline"
          href="https://thegraph.com/docs/en/hosted-service/deploy-subgraph-hosted/#checking-subgraph-health"
        >
          checking subgraph health
        </a>
        ? Just put an ID 👆
      </p>
    )
  }
  if (subgraphID.length !== 46) {
    return <p className="text-center">Invalid subgraph ID</p>
  }
  if (loading) {
    return <p className="text-center">Loading ...</p>
  }
  if (!status) {
    return (
      <p className="text-center">Failed to fetch status, check the ID plz</p>
    )
  }
  return <Status {...status} />
}

const Status = (props: SubgraphIndexingStatus) => {
  const chain = props.chains[0]
  return (
    <div>
      {/* {JSON.stringify(props)} */}
      <div className="my-2 flex flex-row justify-around">
        <p>network: {chain.network}</p>
        <p>
          health:{' '}
          {props.health === 'healthy'
            ? '✅'
            : props.health === 'unhealthy'
            ? '⚠️'
            : '❌'}
        </p>
        <p>synced: {props.synced ? '✅' : '❌'}</p>
        <p>entities: {props.entityCount}</p>
      </div>
      <div className="my-2 flex flex-row justify-around">
        {chain.earliestBlock && <p>start: {chain.earliestBlock?.number}</p>}
        {chain.latestBlock && <p>synced: {chain.latestBlock?.number}</p>}
        {chain.chainHeadBlock && <p>last: {chain.chainHeadBlock?.number}</p>}
      </div>
      {props.fatalError && (
        <div className="my-2 rounded-md border border-red-600 p-1 text-sm text-red-600">
          {props.fatalError?.message}
        </div>
      )}
      {props.nonFatalErrors &&
        props.nonFatalErrors.map((nonFatalError, i) => (
          <div
            key={i}
            className="my-2 rounded-md border border-yellow-600 p-1 text-sm text-yellow-600"
          >
            {nonFatalError.message}
          </div>
        ))}
    </div>
  )
}
