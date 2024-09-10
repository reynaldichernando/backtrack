type SearchType = 'regular' | 'image' | 'video' | 'news' | 'map';
type SearchData = { query: string, next?: string };

interface SearchResult {
    results: Array<Object>;
    hasNext?: boolean;
    next?: string | number;
}

interface RegularSearchResult {
    title: string;
    url: string;
    domain: string;
    description: string;
    icon: string;
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
  
  type RequestFunction = (urlString: string, options?: RequestOptions) => Promise<string>;
  
  const requestNode: RequestFunction = (urlString, options = {}) => {
    return new Promise((resolve, reject) => {
      const urlObject = new URL(urlString);
      const protocol =
        urlObject.protocol === "https:"
          ? require("https")
          : require("http");
  
      const req = protocol.request(
        urlString,
        {
          ...options,
          headers: {
            ...options.headers,
            "X-Forwarded-For": [randomIpV4(), randomIPv6()][
              Math.floor(Math.random() * 2)
            ],
          },
        },
        (res: any) => {
          let data = "";
  
          res.on("data", (chunk: Buffer) => {
            data += chunk;
          });
  
          res.on("end", () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(data);
            } else {
              reject(
                new Error(
                  `Request for ${urlString} failed with status code ${res.statusCode}`,
                ),
              );
            }
          });
        },
      );
  
      req.on("error", (e: Error) => {
        reject(new Error(`Problem with request: ${e.message}`));
      });
  
      if (options.body) {
        req.write(options.body);
      }
  
      req.end();
    });
  };
  
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
  
  export const request: RequestFunction =
    typeof fetch === "undefined" ? requestNode : requestBrowser;
  
  export async function getJS(query: string): Promise<JSResponse> {
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
export const search = async (data: SearchData, type: SearchType = 'regular', all: boolean = false): Promise<SearchResult> => {
    try {
        const apiURL = data.next && typeof data.next === 'string'
            ? { path: data.next, vqd: new URLSearchParams(data.next).get('vqd')! }
            : await getJS(data.query);

        if (type === 'regular') {
            return await regularSearch(apiURL.path, all);
        } else if (type === 'image') {
            return await mediaSearch(
                data.next ? data.next : `/i.js?q=${encodeURIComponent(data.query)}&o=json&s=0&u=bing&l=us-en&vqd=${apiURL.vqd}&p=-1&image_exp=a&product_ad_extensions_exp=b`,
                ({ height, width, image, url, title }) => ({ height, width, image, url, title }),
                all,
            );
        } else if (type === 'video') {
            return await mediaSearch(
                data.next ? data.next : `/v.js?q=${encodeURIComponent(data.query)}&o=json&s=0&u=bing&l=us-en&vqd=${apiURL.vqd}&p=-1`,
                ({ content: url, title, description, duration, images, embed_url, published, publisher }) => ({
                    url, title, description, duration, images, embed_url, published, publisher
                }),
                all,
            );
        } else if (type === 'news') {
            return await mediaSearch(
                data.next ? data.next : `/news.js?q=${encodeURIComponent(data.query)}&o=json&s=0&u=bing&l=us-en&vqd=${apiURL.vqd}&p=-1&noamp=1`,
                ({ excerpt, relative_time, source, title, url, date }) => ({
                    excerpt,
                    relative_time,
                    source,
                    title,
                    url,
                    date: Number(`${date}`.padEnd(13, "0")),
                }),
                all,
            );
        } else if (type === 'map') {
            return await mediaSearch(
                data.next ? data.next : `/local.js?q=${encodeURIComponent(data.query)}&o=json&s=0&u=bing&l=us-en&vqd=${apiURL.vqd}&tg=maps_places&rt=D&mkexp=b&wiki_info=1&is_requery=1&latitude=0&longitude=0&location_type=geoip`,
                ({ id, name, address, city, address_lines, coordinates, country_code, ddg_category: category, display_phone: phone, timezone }) => ({
                    id, name, address, city, address_lines, coordinates, country_code, category, phone, timezone
                }),
                all,
            );
        } else {
            throw new Error(`Invalid type: ${type}`);
        }
    } catch (err) {
        throw err;
    }
};

/**
 * Parse the JS
 *
 * @param {string} path
 * @param {boolean} fetchAll
 * @returns {Promise<{results: RegularSearchResult[], hasNext?: boolean, next?: string}>} The search results.
 */
async function regularSearch(path: string, fetchAll: boolean = false): Promise<{ results: RegularSearchResult[], hasNext?: boolean, next?: string }> {
    const js = await request(`https://app.backtrackhq.workers.dev/?https://links.duckduckgo.com${path}`);
    const result = js.match(/DDG\.pageLayout\.load\('d',? ?(\[.+\])?\);/);
    let data;
    if (result && result[1]) {
        try {
            data = JSON.parse(result[1]);
        } catch (err) {
            throw new Error('Failed parsing from DDG response.');
        }
    } else {
        data = [];
    }
    const next = data.find((d: any) => d.n);
    const parsed = data
        .filter((d: any) => !d.n)
        .map((item: any) => ({
            title: item.t,
            url: item.u,
            domain: item.i,
            description: item.a,
            icon: `https://external-content.duckduckgo.com/ip3/${item.i}.ico`,
        }));

    if (fetchAll && next) {
        return {
            results: [...parsed, ...(await regularSearch(next.n, fetchAll)).results],
        };
    }

    return fetchAll
        ? { results: parsed }
        : { hasNext: Boolean(next), next: next?.n || undefined, results: parsed };
}

/**
 * Parse the JS
 *
 * @param {string} path
 * @param {(item: any) => any} parser
 * @param {boolean} fetchAll
 * @returns {Promise<{results: any[], hasNext?: boolean, next?: string}>} The search results.
 */
async function mediaSearch(
    path: string,
    parser: (item: any) => any,
    fetchAll: boolean = false,
): Promise<{ results: any[], hasNext?: boolean, next?: string }> {
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
