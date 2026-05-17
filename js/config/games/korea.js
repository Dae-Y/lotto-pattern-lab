export const KOREA_GAMES = [
  {
    id: "korea_lotto_645",
    country: "korea",
    locale: "ko-KR",
    name: "로또 6/45",
    shortName: "로또 6/45",
    fileName: "korea-lotto-645.csv",
    parserType: "korea-lotto-645",
    sourceLabel: "동행복권 로또 6/45 회차별 결과 기반 공개 데이터",
    main: {
      label: "당첨번호",
      marker: "W",
      range: 45,
      count: 6,
    },
    secondary: {
      label: "보너스번호",
      marker: "B",
      range: 45,
      count: 1,
      sharesMainGrid: true,
    },
    display: {
      mainMark: "W",
      secondaryMark: "B",
      secondaryClass: "supplementary-hit",
    },
  },
];
