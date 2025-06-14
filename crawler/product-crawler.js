// crawler/product-crawler.js

const axios = require("axios");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const extractProductSpec = require("./spec-parser"); // 스펙 추출 로직 임포트

/**
 * smtcom.co.kr에서 상품 목록을 크롤링합니다.
 * @param {string} cmd - 검색어
 * @param {string} cate1 - 대분류 카테고리 코드
 * @param {string|null} cate2 - 중분류 카테고리 코드
 * @param {string} listOrder - 정렬 순서
 * @returns {Promise<Array<object>>} - 상품 정보 배열
 */
async function fetchProducts(cmd, cate1, cate2, listOrder) {
    const url = "https://www.smtcom.co.kr/skin/shop/basic/estimate_search_new2.php";

    const payload = new URLSearchParams({
        "pd_ment": "Y",
        "chkk[제조회사]": "",
        "search": cmd,
        "depth": "2",
        "cate1": cate1,
        "cate2": cate2 || "",
        "cate3": "",
        "cate4": "",
        "page": "1",
        "list_num": "100",
        "view_no": "Y",
        "list_order": listOrder // 정렬 순서 파라미터 추가
    });

    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://www.smtcom.co.kr",
        "Referer": "https://www.smtcom.co.kr/skin/shop/basic/estimate_search_new_top2.php",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7"
    };

    try {
        const response = await axios.post(url, payload.toString(), {
            headers,
            responseType: "arraybuffer"
        });

        const decodedBody = iconv.decode(response.data, "euc-kr");
        const $ = cheerio.load(decodedBody);
        const products = [];

        $("div.OECR_P_1").each((i, elem) => {
            const nameTag = $(elem).find("td.name a");
            const name = nameTag.text().trim();
            const link = nameTag.attr("href") ? "https://www.smtcom.co.kr" + nameTag.attr("href") : "";

            const imgTag = $(elem).find("div.ORB_P_img img");
            const image = imgTag.attr("src") ? "https://www.smtcom.co.kr" + imgTag.attr("src") : "";

            // 분리된 스펙 추출 로직 사용
            const specTd = $(elem).find("div.ORB_product_spec td");
            const spec = extractProductSpec(specTd);

            const price = $(elem).find("span.OPP_price").text().trim().replace(/,/g, "");

            products.push({ name, link, image, spec, price });
        });

        return products;
    } catch (error) {
        console.error("Error fetching products:", error);
        throw new Error("상품을 가져오는 중 오류가 발생했습니다: " + error.message);
    }
}

module.exports = fetchProducts;