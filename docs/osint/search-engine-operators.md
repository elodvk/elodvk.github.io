---
title: "Search Engine Operators for OSINT"
---

Search engine operators are specialized commands or symbols used to refine search queries, making them invaluable for Open-Source Intelligence (OSINT) tasks. These operators allow precise filtering, exclusion, or targeting of information, such as specific sites, file types, or proximity-based searches. Below is a detailed guide on operators for Google, Bing, Yandex, DuckDuckGo, and Baidu, tailored for OSINT purposes. Each section includes a table of key operators, their syntax, descriptions, and examples, based on official documentation and reliable sources.

## Google Search Operators

Google's operators are robust for OSINT, enabling targeted searches across domains, file types, or cached pages. Use Google's Advanced Search (https://www.google.com/advanced_search) for a GUI or the search bar for direct queries.

| Operator          | Syntax                                   | Description                                                                 | Example                                      |
|-------------------|------------------------------------------|-----------------------------------------------------------------------------|----------------------------------------------|
| AND (implicit)    | term1 term2                              | Finds pages with both terms (default).                                      | biking Italy                                 |
| OR                | term1 OR term2                           | Finds pages with either term.                                               | recycle steel OR iron                        |
| " "               | "exact phrase"                           | Searches for exact phrase.                                                  | "I have a dream"                             |
| -                 | term1 -term2                             | Excludes pages with term2.                                                  | salsa -dance                                 |
| ~                 | ~term                                    | Includes synonyms.                                                          | castle ~glossary                             |
| *                 | term1 * term2                            | Wildcard for word(s) between terms.                                         | "a * saved is a * earned"                    |
| define:           | define: term                             | Provides definitions from the web.                                          | define: imbroglio                            |
| + - * /           | number operator number                   | Performs arithmetic.                                                        | 12 + 34 - 56 * 7 / 8                         |
| % of              | number % of number                       | Calculates percentages.                                                     | 45% of 39                                    |
| ^ or **           | number^number or number**number          | Raises to a power.                                                          | 2^5                                          |
| site:             | site:domain                              | Restricts to a specific site/domain.                                        | halloween site:www.census.gov                |
| ..                | number1..number2                         | Searches numerical range.                                                   | dave barry pirate 2002..2006                 |
| filetype: or ext: | filetype:type                            | Limits to file types.                                                       | form 1098-t irs filetype:pdf                 |
| link:             | link:URL                                 | Finds pages linking to URL.                                                 | link:warriorlibrarian.com                    |
| cache:            | cache:URL                                | Shows cached page version.                                                  | cache:www.irs.gov                            |
| related:          | related:URL                              | Finds similar pages.                                                        | related:www.healthfinder.gov                 |
| info: or id:      | info:URL                                 | Provides page info.                                                         | info:www.theonion.com                        |
| allinanchor:      | allinanchor:keywords                     | All terms in anchor text.                                                   | allinanchor:seo tips                         |
| allintext:        | allintext:keywords                       | All terms in body text.                                                     | allintext:seo blog                           |
| allintitle:       | allintitle:keywords                      | All terms in title.                                                         | allintitle:seo blog                          |
| allinurl:         | allinurl:keywords                        | All terms in URL.                                                           | allinurl:seo blog                            |
| AROUND(n)         | term1 AROUND(n) term2                    | Terms within n words.                                                       | seo AROUND(3) audit                          |
| book or books     | book term                                | Searches book text.                                                         | book ender's game                            |
| movie:            | movie: title                             | Finds movie reviews/showtimes.                                              | movie: traffic                               |
| stocks:           | stocks: ticker                           | Shows stock info.                                                           | stocks: goog                                 |
| weather           | weather location                         | Shows weather forecast.                                                     | weather seattle wa                           |

**OSINT Use Case**: Use `site:`, `filetype:pdf`, or `link:` to uncover documents or connections on specific domains. `cache:` helps retrieve deleted or altered pages.

## Bing Search Operators

Bing's operators are effective for OSINT, especially for SEO diagnostics and link analysis. They focus on site restrictions and file types.

| Operator     | Syntax                        | Description                                                                 | Example                                      |
|--------------|-------------------------------|-----------------------------------------------------------------------------|----------------------------------------------|
| contains:    | contains:type                 | Finds pages linking to file type.                                           | site:yourdomain.com contains:pdf             |
| ext:         | ext:type                      | Limits to file extension.                                                   | ext:htm                                      |
| feed:        | feed:term                     | Finds RSS/Atom feeds.                                                       | feed:seo                                     |
| hasfeed:     | hasfeed:term                  | Finds pages with feeds.                                                     | hasfeed:seo                                  |
| info:        | info:URL                      | Shows page info, including related results.                                 | info:competitorsite.com                      |
| inanchor:    | inanchor:keyword              | Keyword in anchor text.                                                     | inanchor:seo                                 |
| inbody:      | inbody:keyword                | Keyword in body text.                                                       | inbody:seo                                   |
| intitle:     | intitle:keyword               | Keyword in title.                                                           | intitle:seo                                  |
| ip:          | ip:address                    | Sites hosted on an IP.                                                      | ip:192.0.2.1                                 |
| language:    | language:code                 | Limits to language.                                                         | language:en                                  |
| location:    | location:country              | Limits to region.                                                           | location:us                                  |
| OR           | term1 OR term2                | Either term (capitalized).                                                  | john doe (site:linkedin OR site:twitter)     |
| prefer:      | prefer:keyword                | Emphasizes term.                                                            | seo prefer:audit                             |
| site:        | site:domain                   | Restricts to domain.                                                        | site:bruceclay.com page experience update    |
| url:         | url:domain                    | Checks if domain is indexed.                                                | url:bruceclay.com                            |
| -            | term1 -term2                  | Excludes term.                                                              | cats -musical                                |
| " "          | "exact phrase"                | Exact match.                                                                | "search engine optimization"                 |
| ()           | (group)                       | Groups terms for complex queries.                                           | (seo OR sem) audit                           |
| filetype:    | filetype:type                 | Limits to file type.                                                        | filetype:pdf seo                             |

**OSINT Use Case**: `ip:` and `contains:` are powerful for mapping sites hosted on specific servers or finding linked documents.

## Yandex Search Operators

Yandex, widely used in Russia, offers precise operators for OSINT, including proximity and exact-form searches, ideal for regional investigations.

| Operator        | Syntax                                 | Description                                                                 | Example                                      |
|-----------------|----------------------------------------|-----------------------------------------------------------------------------|----------------------------------------------|
| +               | term1 +term2                           | Includes term explicitly.                                                   | audit +seo                                   |
| -               | term1 -term2                           | Excludes term (at query end).                                               | seo -audit                                   |
| " "             | "exact phrase"                         | Exact phrase match.                                                         | "mobile seo audit"                           |
| *               | term1 * term2                          | Wildcard for missing words (with "").                                       | "the best seo *"                             |
| |               | term1 | term2                          | OR logic.                                                                   | seo | sem                                    |
| ~~              | term1 ~~term2                          | NOT; excludes term entirely.                                                | seo ~~audit                                  |
| ~               | term1 ~term2                           | Excludes term from same sentence.                                           | seo ~audit                                   |
| !               | !term                                  | Exact form, no synonyms.                                                    | !seos                                        |
| !!              | !!term                                 | Dictionary form.                                                            | !!seo                                        |
| &               | term1 & term2                          | Terms in same sentence.                                                     | free & seo                                   |
| /+n             | term1 /+n term2                        | Terms within n words (right).                                               | seo /+2 audit                                |
| /-n             | term1 /-n term2                        | Terms within n words (left).                                                | audit /-2 seo                                |
| /(x y)          | term1 /(x y) term2                     | Terms within range x (left) to y (right).                                   | seo /(-3 +3) audit                           |
| ()              | (group)                                | Groups complex queries.                                                     | seo && (+audit | !seo)                       |
| url:            | url:address                            | Exact URL search.                                                           | url:seosly.com                               |
| inurl:          | inurl:term                             | Term in URL.                                                                | inurl:seo                                    |
| site:           | site:domain                            | Restricts to site/subdomains.                                               | site:seosly.com                              |
| domain:         | domain:TLD                             | Restricts to TLD.                                                           | seo domain:com                               |
| host:           | host:www.domain.tld                    | Specific host.                                                              | host:www.seosly.com                          |
| rhost:          | rhost:tld.domain.www                   | Reverse host (with * for subs).                                             | rhost:com.seosly.www                         |
| title:          | title:term                             | Term in title.                                                              | title:seo audit                              |
| mime:           | mime:type                              | File type limit.                                                            | seo mime:pdf                                 |
| lang:           | lang:code                              | Language limit.                                                             | seo lang:en                                  |
| date:           | date:YYYYMMDD                          | Date limit (with * for partial).                                            | date:202408*                                 |

**OSINT Use Case**: `rhost:`, `mime:`, and `/+n` are excellent for mapping subdomains, finding files, or narrowing proximity searches in Russian-language contexts.

## DuckDuckGo Search Operators

DuckDuckGo, privacy-focused, offers simple operators for OSINT, with "bangs" (! ) redirecting queries to other platforms.

| Operator        | Syntax                                 | Description                                                                 | Example                                      |
|-----------------|----------------------------------------|-----------------------------------------------------------------------------|----------------------------------------------|
| term1 term2     | term1 term2                            | OR logic by default.                                                        | cats dogs                                    |
| " "             | "exact phrase"                         | Exact phrase.                                                               | "cats and dogs"                              |
| ~" "            | ~"phrase"                              | Semantically similar phrases (experimental).                                | ~"cats and dogs"                             |
| -               | term1 -term2                           | Reduces presence of term2.                                                  | cats -dogs                                   |
| +               | term1 +term2                           | Increases presence of term2.                                                | cats +dogs                                   |
| filetype:       | term filetype:ext                      | Limits to file type.                                                        | cats filetype:pdf                            |
| site:           | term site:domain                       | Restricts to domain.                                                        | dogs site:example.com                        |
| -site:          | term -site:domain                      | Excludes domain.                                                            | cats -site:example.com                       |
| intitle:        | intitle:term                           | Term in title.                                                              | intitle:dogs                                 |
| inurl:          | inurl:term                             | Term in URL.                                                                | inurl:cats                                   |
| \               | \term                                  | Goes to first result.                                                       | \futurama                                    |
| !bang           | !bang term                             | Searches on another site.                                                   | !a blink182 (Amazon)                         |
| !safeon/off     | term !safeon                           | Toggles safe search.                                                        | cats !safeon                                 |

**OSINT Use Case**: Use `!bang` to pivot to platforms like LinkedIn or Twitter, and `filetype:` to locate public documents.

## Baidu Search Operators

Baidu, dominant in China, supports operators optimized for Chinese-language OSINT, with functionality similar to Google.

| Operator        | Syntax                                 | Description                                                                 | Example                                      |
|-----------------|----------------------------------------|-----------------------------------------------------------------------------|----------------------------------------------|
| intitle:        | intitle:term                           | Term in title.                                                              | intitle:university                           |
| site:           | site:domain                            | Restricts to domain.                                                        | site:seomandarin.com                         |
| inurl:          | inurl:term                             | Term in URL.                                                                | inurl:wikipedia                              |
| " "             | "exact phrase"                         | Exact match.                                                                | "seo service"                                |
| filetype:       | filetype:ext                           | Limits to file type.                                                        | filetype:doc                                 |
| -               | term1 -term2                           | Excludes term.                                                              | seo -fred                                    |
| +               | term1 +term2                           | Includes term.                                                              | 中国刺绣 +历史                               |
| AND             | term1 AND term2                        | Both terms.                                                                 | 中国 AND 刺绣                                |
| OR              | term1 OR term2                         | Either term.                                                                | 中国 OR 刺绣                                 |

**OSINT Use Case**: Combine `site:` and `filetype:` to find Chinese-language documents or use `inurl:` for targeted URL searches.