import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { isValidID } from '..'

interface Block {
  hash: string
  number: string
}

interface SubgraphError {
  message: string
  block?: Block
  handler?: string
  deterministic: boolean
}

interface ChainIndexingStatus {
  network: string
  chainHeadBlock?: Block
  earliestBlock?: Block
  latestBlock?: Block
  lastHealthyBlock?: Block
}

const QUERY_BODY = `{
  subgraph
  synced
  health
  entityCount
  fatalError {
    handler
    message
    deterministic
    block {
      hash
      number
    }
  }
  chains {
    network
    chainHeadBlock {
      number
      hash
    }
    earliestBlock {
      number
      hash
    }
    latestBlock {
      number
      hash
    }
    lastHealthyBlock {
      hash
      number
    }
  }
  node
}`

export interface SubgraphIndexingStatus {
  subgraph: string
  synced: boolean
  health: 'healthy' | 'unhealthy' | 'failed'
  fatalError?: SubgraphError
  // it may or may not be in the response body
  nonFatalErrors?: SubgraphError[]
  chains: ChainIndexingStatus[]
  entityCount: string
  node?: string
}

type Result<T> =
  | {
      data: T
      error?: never
    }
  | {
      data?: never
      error: { message: string }
    }

// Uncomment below to debug
// axios.interceptors.request.use((request) => {
//   console.log('Request:', JSON.stringify(request, null, 2))
//   return request
// })
// axios.interceptors.response.use(response => {
//   console.log('Response:', JSON.stringify(response, null, 2))
//   return response
// })

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<Array<SubgraphIndexingStatus>>>
) {
  const subgraphID = req.query['subgraphID'] as string
  try {
    const data = await fetchStatus(subgraphID)
    if (data === null) {
      res.status(200).send({
        error: {
          message: 'not found',
        },
      })
      return
    }
    res.status(200).send({
      data,
    })
  } catch (error: any) {
    console.log(JSON.stringify(error, Object.getOwnPropertyNames(error)))
    res.status(200).send({
      error: {
        message: 'unknown error',
      },
    })
  }
}

async function fetchStatus(
  subgraphID: string
): Promise<Array<SubgraphIndexingStatus> | null> {
  if (isValidID(subgraphID)) {
    const query = `{ indexingStatuses(subgraphs:["${subgraphID}"])${QUERY_BODY} }`
    const data = (await queryThegraphIndex(query))['indexingStatuses']
    if (data === null) {
      return null
    }
    return data as Array<SubgraphIndexingStatus>
  }
  let a: Array<SubgraphIndexingStatus> = []
  const currentVersionQuery = `{ indexingStatusForCurrentVersion(subgraphName:"${subgraphID}")${QUERY_BODY} }`
  const currentVersionData = (await queryThegraphIndex(currentVersionQuery))[
    'indexingStatusForCurrentVersion'
  ]
  if (currentVersionData === null) {
    return null
  }
  a.push(currentVersionData as SubgraphIndexingStatus)
  const pendingVersionQuery = `{ indexingStatusForPendingVersion(subgraphName:"${subgraphID}")${QUERY_BODY} }`
  const pendingVersionData = (await queryThegraphIndex(pendingVersionQuery))[
    'indexingStatusForPendingVersion'
  ]
  if (pendingVersionData !== null) {
    a.splice(0, 0, pendingVersionData as SubgraphIndexingStatus)
  }
  return a
}

async function queryThegraphIndex(query: string): Promise<any> {
  return (
    await axios.post(
      'https://api.thegraph.com/index-node/graphql',
      JSON.stringify({ query })
    )
  ).data.data
}
