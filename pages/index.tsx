import axios from 'axios'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useQueryState } from 'next-usequerystate'
import React, { useEffect, useState } from 'react'
import { useInterval } from 'react-use'
import { SubgraphIndexingStatus } from './api/status'

const AUTO_REFRESH_INTERVAL = 30

export type Result<T> =
  | {
      data: T
      error?: never
    }
  | {
      data?: never
      error: { message: string }
    }

const Home: NextPage = () => {
  // autofocus input, see https://reactjs.org/docs/hooks-reference.html#useref
  const inputElement = React.useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (inputElement.current) {
      inputElement.current.focus()
    }
  }, [])

  const [q, setQ] = useQueryState('q')
  const [tempQ, setTempQ] = useState(q)
  const [loading, setLoading] = useState(false)
  const [statuses, setStatuses] =
    useState<Array<SubgraphIndexingStatus> | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false)
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date())

  async function fetchData(subgraphID: string) {
    setLoading(true)
    try {
      const resp = await axios.get(`api/status?subgraphID=${subgraphID}`)
      const result = resp.data as Result<Array<SubgraphIndexingStatus>>
      if (result.error) {
        setErrMsg(result.error.message)
        setAutoRefresh(false)
      } else {
        setStatuses(result.data)
        if (result.data.some((status) => status.fatalError === null)) {
          setAutoRefresh(true)
        }
      }
    } catch (error: any) {
      setErrMsg('axios.get failed')
    }
    setLoading(false)
  }

  // fetch on interval
  useInterval(
    () => {
      if (q && (isValidID(q) || isValidName(q))) {
        fetchData(q)
        setUpdatedAt(new Date())
      }
    },
    autoRefresh ? AUTO_REFRESH_INTERVAL * 1000 : null
  )

  // fetch on load if query params is not empty
  useEffect(() => {
    if (q && (isValidID(q) || isValidName(q))) {
      fetchData(q)
    }
  }, [])

  function handleChange(event: React.FormEvent<HTMLInputElement>) {
    // TODO: after visiting to a shared okgraph url, then delete the search string, press enter, it won't trigger Input.onChange
    // console.log(`changed to [${event.currentTarget.value}]`)
    setTempQ(event.currentTarget.value)
  }

  function handleSubmit(event: React.FormEvent<HTMLInputElement>) {
    event.preventDefault()
    setStatuses(null)
    setErrMsg(null)
    const q = tempQ
    setQ(q, { scroll: false, shallow: true })
    if (q && (isValidID(q) || isValidName(q))) {
      fetchData(q)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center font-mono">
      <Head>
        <title>👌graph</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex w-full flex-1 items-center sm:w-3/5 lg:w-2/5">
        <div className="w-full">
          <div className=" text-center">
            <p className="mt-5 text-6xl font-bold text-purple-600">👌graph</p>
            <p className="my-5 text-xl text-purple-600">
              🚀 A lightning fast subgraph UI
            </p>
          </div>
          <input
            type="text"
            className="my-3 w-full rounded border border-solid border-purple-600 bg-white px-3 py-1.5 text-center outline-none"
            placeholder={'"Qm..." or "org/subgraph"'}
            value={tempQ || ''}
            onChange={handleChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSubmit(e)
              }
            }}
            ref={inputElement}
          />
          {autoRefresh && (
            <p className="my-3 rounded bg-purple-300 p-2 text-center text-sm">
              ⏰ Auto refresh every 30s. Last updated at{' '}
              {updatedAt.toLocaleTimeString('en-US')}
            </p>
          )}
          <Display
            subgraphID={q || ''}
            loading={loading}
            statuses={statuses}
            errMsg={errMsg}
          />
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
          <a className="underline" href="https://theybuidl.xyz">
            theybuidl.xyz
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

// TODO: split into 2, one for pre-fetch error, another for post-fetch error and data
function Display({
  subgraphID,
  loading,
  statuses,
  errMsg,
}: {
  subgraphID: string
  loading: boolean
  statuses: Array<SubgraphIndexingStatus> | null
  errMsg: string | null
}) {
  if (subgraphID.length === 0) {
    return (
      <p className="my-3 text-center">
        Tired of{' '}
        <a
          className="underline"
          href="https://thegraph.com/docs/en/hosted-service/deploy-subgraph-hosted/#checking-subgraph-health"
        >
          checking subgraph health
        </a>
        ? Put an Qm-ID or a name 👆
      </p>
    )
  }
  if (!isValidID(subgraphID) && !isValidName(subgraphID)) {
    return <p className="my-3 text-center">❌ Invalid subgraph ID</p>
  }
  if (loading) {
    return <p className="my-3 text-center">⏳ Loading ...</p>
  }
  if (errMsg) {
    return <p className="my-3 text-center">{errMsg}</p>
  }
  if (statuses) {
    return (
      <div className="flex flex-col space-y-4 divide-y-2 divide-purple-600">
        {statuses.map((status, i) => (
          <Status key={i} {...status} />
        ))}
      </div>
    )
  }
  return <p className="my-3 text-center">🥲 This should not happen</p>
}

const Status = (props: SubgraphIndexingStatus) => {
  const chain = props.chains[0]
  return (
    <div className="p-2">
      <div className="my-3 grid grid-cols-2 gap-4">
        <div>
          <div>ID</div>
          <div className="truncate text-purple-600">{props.subgraph}</div>
        </div>
        <div>
          <div>Links</div>
          <div>
            <a
              className="text-purple-600 hover:underline"
              href={`https://api.thegraph.com/subgraphs/id/${props.subgraph}`}
            >
              API
            </a>
            {' ⛓️ '}

            <a
              className="text-purple-600 hover:underline"
              href={`https://api.thegraph.com/explorer/graphql?query=${encodeURIComponent(
                `{
  subgraphLogs(
    subgraphId: "${props.subgraph}"
    first: 100
    order: NewestFirst
    filters: ["error", "warning"]
    searchText: ""
  ) {
    timestamp
    text
  }
}`
              )}`}
            >
              Logs
            </a>
          </div>
        </div>
      </div>
      <div className="my-3 grid grid-cols-4 gap-4">
        <div>
          <div>Network</div>
          <div className="text-purple-600">{chain.network}</div>
        </div>
        <div>
          <div>Health</div>
          <div>
            {props.health === 'healthy'
              ? '✅'
              : props.health === 'unhealthy'
              ? '⚠️'
              : '❌'}
          </div>
        </div>
        <div>
          <div>Synced</div>
          <div>{props.synced ? '✅' : '❌'}</div>
        </div>
        <div>
          <div>Entities</div>
          <div className="text-purple-600">
            {parseInt(props.entityCount).toLocaleString('en-US')}
          </div>
        </div>
      </div>
      <div className="my-3 grid grid-cols-4 gap-4">
        {chain.earliestBlock && (
          <div>
            <div>Start #</div>
            <div className="text-purple-600">
              {parseInt(chain.earliestBlock.number).toLocaleString('en-US')}
            </div>
          </div>
        )}
        {chain.latestBlock && (
          <div>
            <div>Synced #</div>
            <div className="text-purple-600">
              {parseInt(chain.latestBlock.number).toLocaleString('en-US')}
            </div>
          </div>
        )}
        {chain.chainHeadBlock && (
          <div>
            <div>Last #</div>
            <div className="text-purple-600">
              {parseInt(chain.chainHeadBlock.number).toLocaleString('en-US')}
            </div>
          </div>
        )}
        {chain.earliestBlock && chain.latestBlock && chain.chainHeadBlock && (
          <div>
            <div>Progress</div>
            <div className="text-purple-600">
              {(
                (100 *
                  (Number(chain.latestBlock?.number) -
                    Number(chain.earliestBlock?.number))) /
                (Number(chain.chainHeadBlock?.number) -
                  Number(chain.earliestBlock?.number))
              ).toFixed(2)}
              %
            </div>
          </div>
        )}
      </div>
      {props.fatalError && (
        <div className="my-3 flex flex-col space-y-3 rounded-md border border-red-600 p-2 text-sm text-red-600">
          A{' '}
          {props.fatalError?.deterministic
            ? 'determinstic'
            : 'non-deterministic'}{' '}
          fatal error occured
          {props.fatalError?.block
            ? ` at block ${props.fatalError?.block?.number}`
            : ''}
          {props.fatalError?.handler
            ? ` on handler ${props.fatalError?.handler}`
            : ''}
          : {props.fatalError?.message}
        </div>
      )}
      {props.nonFatalErrors &&
        props.nonFatalErrors.map((nonFatalError, i) => (
          <div
            key={i}
            className="my-3 rounded-md border border-yellow-600 p-1 text-sm text-yellow-600"
          >
            {nonFatalError.handler && (
              <div>handler: {nonFatalError.handler}</div>
            )}
            {nonFatalError.block?.number && (
              <div>block number: {nonFatalError.block?.number}</div>
            )}
            {nonFatalError.message && (
              <div>message: {nonFatalError.message}</div>
            )}
          </div>
        ))}
    </div>
  )
}

export function isValidID(id: string): boolean {
  return id.length === 46 && id.startsWith('Qm')
}

export function isValidName(name: string): boolean {
  return (
    name.split('/').length === 2 && !name.startsWith('/') && !name.endsWith('/')
  )
}
