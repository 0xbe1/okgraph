import type { NextPage } from 'next'
import Head from 'next/head'
import React, { useEffect, useState } from 'react'

const Home: NextPage = () => {
  // autofocus input, see https://reactjs.org/docs/hooks-reference.html#useref
  const inputElement = React.useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (inputElement.current) {
      inputElement.current.focus()
    }
  }, [])

  const [subgraphID, setSubgraphID] = useState('')

  function handleChange(event: React.FormEvent<HTMLInputElement>) {
    setSubgraphID(event.currentTarget.value)
  }

  return (
    <div className="flex min-h-screen flex-col items-center font-mono">
      <Head>
        <title>okgraph</title>
        <link rel="icon" href="/favicon.ico" />
        <script async src="https://cdn.splitbee.io/sb.js"></script>
      </Head>

      <main className="flex w-full flex-1 items-center sm:w-3/5 lg:w-2/5">
        <div className="w-full">
          <div className=" text-center">
            <p className="text-purple-600 text-6xl font-bold">
              okgraph
            </p>
            <p className="mt-3 text-xl">
              Is your subgraph OK?
            </p>
          </div>
          <input
            type="text"
            className="form-control relative my-5 block w-full min-w-0 flex-auto rounded border border-solid border-gray-300 bg-white bg-clip-padding px-3 py-1.5 text-center text-base font-normal text-gray-700 transition ease-in-out focus:border-purple-600 focus:bg-white focus:text-gray-700 focus:outline-none"
            placeholder="Subgraph ID"
            aria-label="Search"
            aria-describedby="button-addon2"
            value={subgraphID}
            onChange={handleChange}
            ref={inputElement}
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
