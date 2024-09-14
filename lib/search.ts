import { SearchResultItem } from "./model/SearchResultItem";

type SearchData = { query: string, next?: string };
type RequestFunction = (urlString: string, options?: RequestOptions) => Promise<string>;

interface RawSearchResultItem {
  content: string;
  title: string;
  description: string;
  duration: number;
  images: object;
  embed_url: string;
  published: string;
  publisher: string;
  uploader: string;
}

interface SearchResult {
  results: Array<SearchResultItem>;
  hasNext?: boolean;
  next?: string | number;
}

interface RequestOptions {
  method?: string;
  headers?: { [key: string]: string };
  body?: string;
}

interface JSResponse {
  url: string;
  path: string;
  vqd: string;
}

function randomIpV4(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(
    Math.random() * 255,
  )}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function randomIPv6(): string {
  const hexChars = "0123456789abcdef";
  let ipv6 = "";

  for (let i = 0; i < 8; i++) {
    let segment = "";
    for (let j = 0; j < 4; j++)
      segment += hexChars[Math.floor(Math.random() * hexChars.length)];
    ipv6 += segment;
    if (i < 7) ipv6 += ":";
  }

  return ipv6;
}

const requestBrowser: RequestFunction = (urlString, options = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      new URL(urlString);
      try {
        const res = await fetch(urlString, {
          ...options,
          headers: {
            ...options.headers,
            "X-Forwarded-For": [randomIpV4(), randomIPv6()][
              Math.floor(Math.random() * 2)
            ],
          },
        });
        try {
          resolve(await res.text());
        } catch (err) {
          reject(new Error(`Error parsing response from ${urlString}`));
        }
      } catch (err) {
        reject(new Error(`Request for ${urlString} failed`));
      }
    } catch (err) {
      reject(err);
    }
  });
};

const request: RequestFunction = requestBrowser;

async function getJS(query: string): Promise<JSResponse> {
  const html = await request(`https://app.backtrackhq.workers.dev/?https://duckduckgo.com/?q=${encodeURIComponent(query)}`);
  const urlMatch = html.match(/"(https:\/\/links\.duckduckgo\.com\/d\.js[^">]+)">/);
  if (!urlMatch) {
    throw new Error('URL not found in the HTML response');
  }

  const url = urlMatch[1];
  const pathMatch = url.match(/\/d\.js.*/);
  const vqdMatch = url.match(/vqd=([^&]+)/);

  if (!pathMatch || !vqdMatch) {
    throw new Error('Unable to extract path or vqd from the URL');
  }

  return {
    url,
    path: pathMatch[0],
    vqd: vqdMatch[1],
  };
};

/**
 *
 * @param {SearchData} data
 * @param {SearchType} type
 * @param {boolean} all
 * @returns {Promise<SearchResult>}
 */
export const search = async (data: SearchData, all: boolean = false): Promise<SearchResult> => {
  try {
    const apiURL = data.next && typeof data.next === 'string'
      ? { path: data.next, vqd: new URLSearchParams(data.next).get('vqd')! }
      : await getJS(data.query);

    return await mediaSearch(
      data.next ? data.next : `/v.js?q=${encodeURIComponent(data.query)}&o=json&s=0&u=bing&l=us-en&vqd=${apiURL.vqd}&p=-1`,
      ({ content: url, title, description, duration, images, embed_url, published, publisher, uploader }: RawSearchResultItem) => ({
        url, title, description, duration, images, embed_url, published, publisher, uploader
      } as SearchResultItem),
      all,
    );
  } catch (err) {
    throw err;
  }
};

/**
 * Parse the JS
 *
 * @param {string} path
 * @param {(item: RawSearchResultItem) => SearchResultItem} parser
 * @param {boolean} fetchAll
 * @returns {Promise<{results: SearchResultItem[], hasNext?: boolean, next?: string}>} The search results.
 */
async function mediaSearch(
  path: string,
  parser: (item: RawSearchResultItem) => SearchResultItem,
  fetchAll: boolean = false,
): Promise<{ results: SearchResultItem[], hasNext?: boolean, next?: string }> {
  const url = new URL(`https://app.backtrackhq.workers.dev/?https://duckduckgo.com${path}`);
  try {
    const res = await request(url.href);
    let results, next;

    try {
      const parsed = JSON.parse(res);
      const nextCursor = new URLSearchParams(parsed.next).get('s');
      const nextVqd = parsed.vqd[parsed.queryEncoded];
      results = parsed.results;
      url.searchParams.set('s', nextCursor!);
      url.searchParams.set('vqd', nextVqd!);
      next = `${url.pathname}?${url.searchParams.toString()}`;
    } catch (err) {
      throw new Error(`Failed parsing from DDG response https://duckduckgo.com${path}`);
    }

    const data = results.map(parser);
    if (fetchAll && next) {
      return {
        results: [
          ...data,
          ...(await mediaSearch(`/${next}`, parser, fetchAll)).results,
        ],
      };
    }

    return fetchAll
      ? { results: data }
      : { results: data, hasNext: Boolean(next), next: next || undefined };
  } catch (err) {
    throw err;
  }
}
