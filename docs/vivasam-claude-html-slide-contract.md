# Claude Design HTML 슬라이드 전달 규격

Claude Design에는 시각 디자인 지시를 추가하지 않습니다. 아래 항목은 Eduitit 뷰어에서 원본 디자인을 깨뜨리지 않고 실행하기 위한 기술 규격입니다.

## Claude에 함께 보낼 기술 지시

```text
완성본은 PPTX가 아니라 단일 HTML 파일로 내보내 주세요.
디자인은 자유롭게 하되 다음 기술 규격을 지켜 주세요.

1. 파일은 외부 CDN 없이 단독 실행되어야 합니다.
2. <meta name="eduitit-slide-size" content="1600x900">를 head에 넣어 주세요.
3. 모든 슬라이드를 감싸는 하나의 직접 부모에 data-eduitit-deck 속성을 넣어 주세요.
4. 각 슬라이드는 그 부모의 직접 자식이며 data-slide 속성을 하나씩 가져야 합니다.
5. 각 슬라이드 캔버스는 16:9이고 서로 겹쳐 놓아도 한 장씩 완전하게 보여야 합니다.
6. 외부 URL, iframe, object, embed, form, base, 자동 새로고침을 사용하지 마세요.
7. 이미지가 필요하면 HTML 내부의 PNG/JPEG/WebP data URL을 사용하세요. SVG data URL은 사용하지 마세요.
8. 이전/다음, 페이지 번호, 전체 화면 버튼은 만들지 마세요. 이 기능은 Eduitit 뷰어가 제공합니다.
9. 슬라이드 문구는 이미지로 합치지 말고 선택 가능한 실제 텍스트로 유지해 주세요.
10. 최종 파일명은 LESSON_ID-slides.html 형식으로 저장해 주세요.
11. 파일 크기는 12MB 이하여야 합니다.
```

## 최소 구조

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="eduitit-slide-size" content="1600x900">
  <title>수업 제목</title>
  <style>/* Claude Design이 만든 전체 디자인 */</style>
</head>
<body>
  <main data-eduitit-deck>
    <section data-slide>첫 번째 슬라이드</section>
    <section data-slide>두 번째 슬라이드</section>
  </main>
</body>
</html>
```

## 저장 위치와 검사

- 저장 위치: `artifacts/vivasam/LESSON_ID/claude/LESSON_ID-slides.html`
- 검사 명령:

```bash
node tools/vivasam-bundle/check-claude-html-slides.cjs \
  artifacts/vivasam/LESSON_ID/claude/LESSON_ID-slides.html
```

같은 차시에 HTML과 PPTX가 모두 있으면 HTML을 공개 발표 자료로 우선 사용합니다. PPTX는 내부 원본으로만 남고 공개 페이지에는 노출하지 않습니다.
