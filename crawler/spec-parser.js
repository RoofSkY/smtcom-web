// crawler/spec-parser.js

/**
 * Cheerio 엘리먼트에서 상품 스펙 텍스트를 추출하고 정제합니다.
 * @param {Cheerio<Element>} $specTd - 상품 스펙을 포함하는 'td' Cheerio 엘리먼트
 * @returns {string} - 정제된 상품 스펙 문자열
 */
function extractProductSpec($specTd) {
    if (!$specTd || $specTd.length === 0) {
        return "";
    }

    // Cheerio의 contents()와 filter()를 사용해 텍스트 노드만 추출합니다.
    let spec = $specTd.contents().filter(function () {
        return this.nodeType === 3; // Node.TEXT_NODE (텍스트 노드)
    }).first().text().trim();

    // 불필요한 "상품정보" 및 관련 문자열을 제거합니다.
    spec = spec.replace(/상품정보\s*\S*\s*\S*\s*/g, '').trim();

    // 연속된 공백을 하나로 줄이고, 불필요한 줄바꿈을 제거합니다.
    spec = spec.replace(/\s+/g, ' ').trim();

    // 문자열 끝에 붙는 ' /' 패턴을 제거합니다.
    if (spec.endsWith(' /')) {
        spec = spec.slice(0, -2).trim();
    }

    return spec;
}

module.exports = extractProductSpec;