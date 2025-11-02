// js/catalog.js
// ATTENZIONE: serve UrlParser già caricato prima di questo file

const CATALOG = [
  {
    id: "OnePieceITA",
    title: "One Piece (ITA)",
    image: "https://i.imgur.com/L2sTPqV.jpeg",
    generator: "auto-range",
    segments: [
      {
        from: 1, to: 599,
        baseUrl: "https://srv14-caviale.sweetpixel.org/DDL/ANIME/OnePieceITA/",
        filePrefix: "OnePiece_Ep_",
        padLength: 3,
        lang: "ITA"
      },
      {
        from: 600, to: 889,
        baseUrl: "https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/OnePieceITA/",
        filePrefix: "OnePiece_Ep_",
        padLength: 3,
        lang: "ITA",
        startNumber: 600
      }
    ]
  },

  {
    id: "OnePiece-subITA",
    title: "One Piece (SUB-ITA)",
    image: "https://i.imgur.com/YJ6oiFm.jpeg",
    generator: "auto-range",
    segments: [
      {
        from: 1, to: 400,
        baseUrl: "https://srv26-lampada.sweetpixel.org/DDL/ANIME/OnePieceSUBITA/",
        filePrefix: "OnePiece_Ep_",
        padLength: 4,
        lang: "SUB ITA"
      },
      {
        from: 401, to: 800,
        baseUrl: "https://srv19-sushi.sweetpixel.org/DDL/ANIME/OnePieceSUBITA/",
        filePrefix: "OnePiece_Ep_",
        padLength: 4,
        lang: "SUB ITA",
        startNumber: 401
      },
      {
        from: 801, to: 1146,
        baseUrl: "https://srv19-sushi.sweetpixel.org/DDL/ANIME/OnePieceSUBITA/",
        filePrefix: "OnePiece_Ep_",
        padLength: 4,
        lang: "SUB ITA",
        startNumber: 801
      }
    ]
  },

  UrlParser.quickAddSeries(
    'https://srv23-yama.sweetpixel.org/DDL/ANIME/HunterXHunter/HunterXHunter_Ep_001_SUB_ITA.mp4',
    'Hunter x Hunter (SUB-ITA)', 148,
    { image: 'https://i.imgur.com/7I1ZLeJ.jpeg' }
  ),

  UrlParser.quickAddSeries(
    'https://srv15-cuccia.sweetpixel.org/DDL/ANIME/BlackClover/BlackClover_Ep_001_SUB_ITA.mp4',
    'Black Clover (SUB-ITA)', 170,
    { image: 'https://i.imgur.com/5eMMefj.jpeg' }
  ),

  {
    id: 'SnK',
    title: 'Attack On Titan (SUB ITA)',
    image: 'https://i.imgur.com/n2G627u.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv30-emiko.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin/ShingekiNoKyojin_Ep_01_SUB_ITA.mp4',
        25,
        'Stagione 1'
      ),
      UrlParser.quickAddSeason(
        'https://srv22-remote.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin2/ShingekiNoKyojin2_Ep_01_SUB_ITA.mp4',
        12,
        'Stagione 2',
        { image:'https://i.imgur.com/pipc5g7.jpeg' }
      ),
      UrlParser.quickAddSeason(
        'https://srv28-kokeshi.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin3/ShingekiNoKyojin3_Ep_01_SUB_ITA.mp4',
        22,
        'Stagione 3',
        { image:'https://i.imgur.com/GlZeuLY.jpeg' }
      ),
      UrlParser.quickAddSeason(
        'https://srv16-suisen.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin4/ShingekiNoKyojin4_Ep_01_SUB_ITA.mp4',
        16,
        'Stagione 4 Parte 1',
        { image:'https://i.imgur.com/f2nyTAX.jpeg' }
      ),
      UrlParser.quickAddSeason(
        'https://srv16-suisen.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin4Part2/ShingekiNoKyojin4Part2_Ep_01_SUB_ITA.mp4',
        12,
        'Stagione 4 Parte 2',
        { image:'https://i.imgur.com/f2nyTAX.jpeg' }
      )
    ]
  },

  {
    id: 'Chainsaw-ita',
    title: 'Chainsaw Man (ITA)',
    image: 'https://i.imgur.com/6I0aGYy.png',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv22-remote.sweetpixel.org/DDL/ANIME/ChainsawManITA/ChainsawMan_Ep_01_ITA.mp4',
        12,
        'Stagione 1'
      )
    ]
  },

  {
    id: 'VinlandSaga-ita',
    title: 'Vinland Saga (ITA)',
    image: 'https://i.imgur.com/tK6OjGn.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv14-caviale.sweetpixel.org/DDL/ANIME/VinlandSagaITA/VinlandSaga_Ep_01_ITA.mp4',
        24,
        'Stagione 1'
      ),
      UrlParser.quickAddSeason(
        'https://srv30-emiko.sweetpixel.org/DDL/ANIME/VinlandSaga2ITA/VinlandSaga2_Ep_01_ITA.mp4',
        24,
        'Stagione 2',
        { image:'https://i.imgur.com/s4jrBdE.jpeg' }
      )
    ]
  },

  {
    id: 'tokyo-rev-ita',
    title: 'Tokyo Revengers (ITA)',
    image: 'https://i.imgur.com/Upo6C7l.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv30-emiko.sweetpixel.org/DDL/ANIME/TokyoRevengersITA/TokyoRevengers_Ep_01_ITA.mp4',
        24,
        'Stagione 1'
      )
    ]
  },

  {
    id: 'jjk-ita',
    title: 'Jujutsu Kaisen (ITA)',
    image: 'https://i.imgur.com/XBfPQOZ.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv26-lampada.sweetpixel.org/DDL/ANIME/JujutsuKaisenITA/JujutsuKaisen_Ep_01_ITA.mp4',
        24,
        'Stagione 1'
      ),
      UrlParser.quickAddSeason(
        'https://srv17-geisha.sweetpixel.org/DDL/ANIME/JujutsuKaisen2ITA/JujutsuKaisen2_Ep_01_ITA.mp4',
        23,
        'Stagione 2',
        { image:'https://i.imgur.com/swRaN5Y.jpeg' }
      )
    ]
  },

  {
    id: 'hellsparadise',
    title: "Hell's Paradise (SUB ITA)",
    image: 'https://i.imgur.com/0Fgpced.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv27-gordon.sweetpixel.org/DDL/ANIME/Jigokuraku/Jigokuraku_Ep_01_SUB_ITA.mp4',
        13,
        'Stagione 1'
      )
    ]
  },

  {
    id: 'hellsparadise-ita',
    title: "Hell's Paradise (ITA)",
    image: 'https://i.imgur.com/d38rp7W.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv13-eraser.sweetpixel.org/DDL/ANIME/JigokurakuITA/Jigokuraku_Ep_01_ITA.mp4',
        13,
        'Stagione 1'
      )
    ]
  },

  {
    id: 'gachiakuta-ita',
    title: 'Gachiakuta (ITA)',
    image: 'https://i.imgur.com/bmjQnGO.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/GachiakutaITA/Gachiakuta_Ep_01_ITA.mp4',
        13,
        'Stagione 1'
      )
    ]
  },

  UrlParser.quickAddSeries(
    'https://srv21-airbus.sweetpixel.org/DDL/ANIME/FairyTailITA/FairyTail_Ep_001_ITA.mp4',
    'Fairy Tail (ITA)', 175,
    { image: 'https://i.imgur.com/jtAk33L.jpeg' }
  ),

  {
    id: 'MyheroAcademiaITA',
    title: 'My Hero Academia (ITA)',
    image: 'https://i.imgur.com/a6oZaJX.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv12-bananini.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademiaITA/BokuNoHeroAcademia_Ep_01_ITA.mp4',
        13,
        'Stagione 1'
      ),
      UrlParser.quickAddSeason(
        'https://srv27-gordon.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademia2ITA/BokuNoHeroAcademia2_Ep_01_ITA.mp4',
        25,
        'Stagione 2'
      ),
      UrlParser.quickAddSeason(
        'https://srv26-lampada.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademia3ITA/BokuNoHeroAcademia3_Ep_01_ITA.mp4',
        25,
        'Stagione 3'
      ),
      UrlParser.quickAddSeason(
        'https://srv26-lampada.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademia4ITA/BokuNoHeroAcademia4_Ep_01_ITA.mp4',
        25,
        'Stagione 4'
      ),
      UrlParser.quickAddSeason(
        'https://srv16-suisen.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademia5ITA/BokuNoHeroAcademia5_Ep_01_ITA.mp4',
        25,
        'Stagione 5'
      ),
      UrlParser.quickAddSeason(
        'https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademia6ITA/BokuNoHeroAcademia6_Ep_01_ITA.mp4',
        25,
        'Stagione 6'
      ),
      UrlParser.quickAddSeason(
        'https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademia7ITA/BokuNoHeroAcademia7_Ep_01_ITA.mp4',
        21,
        'Stagione 7'
      )
    ]
  },

  {
    id: 'drstoneITA',
    title: 'Dr. Stone (ITA)',
    image: 'https://i.imgur.com/73E1OPV.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv26-lampada.sweetpixel.org/DDL/ANIME/DrStoneITA/DrStone_Ep_01_ITA.mp4',
        24,
        'Stagione 1'
      ),
      UrlParser.quickAddSeason(
        'https://srv20-coat.sweetpixel.org/DDL/ANIME/DrStone2ITA/DrStone2_Ep_01_ITA.mp4',
        11,
        'Stagione 2'
      ),
      UrlParser.quickAddSeason(
        'https://srv12-bananini.sweetpixel.org/DDL/ANIME/DrStone3ITA/DrStone3_Ep_01_ITA.mp4',
        22,
        'Stagione 3'
      ),
      UrlParser.quickAddSeason(
        'https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/DrStone4ITA/DrStone4_Ep_01_ITA.mp4',
        24,
        'Stagione 4'
      )
    ]
  },

  UrlParser.quickAddSeries(
    'https://srv17-geisha.sweetpixel.org/DDL/ANIME/BleachITA/Bleach_Ep_001_ITA.mp4',
    'Bleach (ITA)', 366,
    { image: 'https://i.imgur.com/dZm9Lu4.jpeg' }
  ),

  UrlParser.quickAddSeries(
    'https://srv15-cuccia.sweetpixel.org/DDL/ANIME/DetectiveConan/DetectiveConan_Ep_0001_ITA.mp4',
    'Detective Conan (ITA)', 1160,
    { image: 'https://i.imgur.com/Uh6TWm9.jpeg' }
  ),

  {
    id: 'haikyuITA',
    title: 'Haikyuu!! (ITA)',
    image: 'https://i.imgur.com/UR9hVbS.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv13-eraser.sweetpixel.org/DDL/ANIME/HaikyuuITA/Haikyuu_Ep_01_ITA.mp4',
        25,
        'Stagione 1'
      ),
      UrlParser.quickAddSeason(
        'https://srv17-geisha.sweetpixel.org/DDL/ANIME/Haikyuu2ITA/Haikyuu2_Ep_01_ITA.mp4',
        25,
        'Stagione 2'
      ),
      UrlParser.quickAddSeason(
        'https://srv22-remote.sweetpixel.org/DDL/ANIME/Haikyuu3ITA/Haikyuu3_Ep_01_ITA.mp4',
        10,
        'Stagione 3'
      ),
      UrlParser.quickAddSeason(
        'https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/HaikyuuToTheTopITA/HaikyuuToTheTop_Ep_01_ITA.mp4',
        13,
        'Stagione 4'
      ),
      UrlParser.quickAddSeason(
        'https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/HaikyuuToTheTop2ITA/HaikyuuToTheTop2_Ep_01_ITA.mp4',
        12,
        'Stagione 5'
      )
    ]
  },

  {
    id: 'bluelock-ita',
    title: 'Blue Lock (ITA)',
    image: 'https://i.imgur.com/YOYjAco.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv26-lampada.sweetpixel.org/DDL/ANIME/BlueLockITA/BlueLock_Ep_01_ITA.mp4',
        24,
        'Stagione 1'
      ),
      UrlParser.quickAddSeason(
        'https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/BlueLock2ITA/BlueLock2_Ep_01_ITA.mp4',
        14,
        'Stagione 2'
      )
    ]
  },

  {
    id: 'soloLeveling-ita',
    title: 'Solo Leveling (ITA)',
    image: 'https://i.imgur.com/uHGaLy8.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv16-suisen.sweetpixel.org/DDL/ANIME/OreDakeLevelUpNaKenITA/OreDakeLevelUpNaKen_Ep_01_ITA.mp4',
        12,
        'Stagione 1'
      ),
      UrlParser.quickAddSeason(
        'https://srv16-suisen.sweetpixel.org/DDL/ANIME/OreDakeLevelUpNaKen2ITA/OreDakeLevelUpNaKen2_Ep_01_ITA.mp4',
        13,
        'Stagione 2'
      )
    ]
  },

  {
    id: 'TheEminenceInShadow-ita',
    title: 'The Eminence In Shadow (ITA)',
    image: 'https://i.imgur.com/VDfJF58.png',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv19-sushi.sweetpixel.org/DDL/ANIME/KageNoJitsuryokushaNiNaritakuteITA/KageNoJitsuryokushaNiNaritakute_Ep_01_ITA.mp4',
        20,
        'Stagione 1'
      ),
      UrlParser.quickAddSeason(
        'https://srv13-eraser.sweetpixel.org/DDL/ANIME/KageNoJitsuryokushaNiNaritakute2ITA/KageNoJitsuryokushaNiNaritakute2_Ep_01_ITA.mp4',
        12,
        'Stagione 2'
      )
    ]
  },

  {
    id: 'DemonSlayer-ita',
    title: 'Demon Slayer (ITA)',
    image: 'https://i.imgur.com/Yzj0U7Z.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv12-bananini.sweetpixel.org/DDL/ANIME/KimetsuNoYaibaITA/KimetsuNoYaiba_Ep_01_ITA.mp4',
        26,
        'Stagione 1'
      ),
      UrlParser.quickAddSeason(
        'https://srv15-cuccia.sweetpixel.org/DDL/ANIME/KimetsuNoYaibaMugenRessha-henITA/KimetsuNoYaibaMugenRessha-hen_Ep_01_ITA.mp4',
        7,
        'Stagione 2'
      ),
      UrlParser.quickAddSeason(
        'https://srv16-suisen.sweetpixel.org/DDL/ANIME/KimetsuNoYaibaYuukaku-henITA/KimetsuNoYaibaYuukaku-hen_Ep_01_ITA.mp4',
        11,
        'Stagione 3'
      ),
      UrlParser.quickAddSeason(
        'https://srv16-suisen.sweetpixel.org/DDL/ANIME/KimetsuNoYaibaKatanakajiNoSato-henITA/KimetsuNoYaibaKatanakajiNoSato-hen_Ep_01_ITA.mp4',
        11,
        'Stagione 4'
      ),
      UrlParser.quickAddSeason(
        'https://srv16-suisen.sweetpixel.org/DDL/ANIME/KimetsuNoYaibaHashiraGeiko-henITA/KimetsuNoYaibaHashiraGeiko-hen_Ep_01_ITA.mp4',
        8,
        'Stagione 5'
      )
    ]
  },

  // Pokemon (ITA)
  UrlParser.quickAddSeries(
    'https://srv14-caviale.sweetpixel.org/DDL/ANIME/PokemonITA/Pokemon_Ep_001_ITA.mp4',
    'Pokemon (ITA)',
    264,
    {
      id: 'pokemonITA',
      image: 'https://i.imgur.com/5D4979d.jpeg'
    }
  ),

  {
    id: 'KurokoNoBasketSUB-ITA',
    title: 'KurokoNoBasket (SUB-ITA)',
    image: 'https://i.imgur.com/59rRf4B.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv28-kokeshi.sweetpixel.org/DDL/ANIME/KurokoNoBasket/KurokoNoBasket_Ep_01_SUB_ITA.mp4',
        25,
        'Stagione 1'
      ),
      UrlParser.quickAddSeason(
        'https://srv28-kokeshi.sweetpixel.org/DDL/ANIME/KurokoNoBasket2/KurokoNoBasket2_Ep_01_SUB_ITA.mp4',
        25,
        'Stagione 2'
      ),
      UrlParser.quickAddSeason(
        'https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/KurokoNoBasket3/KurokoNoBasket3_Ep_01_SUB_ITA.mp4',
        25,
        'Stagione 3'
      )
    ]
  },

  {
    id: 'tsdsSUB-ITA',
    title: 'The Seven Deadly Sins (SUB-ITA)',
    image: 'https://i.imgur.com/ecOOwwS.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv16-suisen.sweetpixel.org/DDL/ANIME/NanatsuNoTaizai/NanatsuNoTaizai_Ep_01_SUB_ITA.mp4',
        24,
        'Stagione 1'
      ),
      UrlParser.quickAddSeason(
        'https://srv23-yama.sweetpixel.org/DDL/ANIME/NanatsuNoTaizai2/NanatsuNoTaizai2_Ep_01_SUB_ITA.mp4',
        24,
        'Stagione 2'
      ),
      UrlParser.quickAddSeason(
        'https://srv23-yama.sweetpixel.org/DDL/ANIME/NanatsuNoTaizai3/NanatsuNoTaizai3_Ep_01_SUB_ITA.mp4',
        24,
        'Stagione 3'
      ),
      UrlParser.quickAddSeason(
        'https://srv26-lampada.sweetpixel.org/DDL/ANIME/NanatsuNoTaizai4/NanatsuNoTaizai4_Ep_01_SUB_ITA.mp4',
        24,
        'Stagione 4'
      ),
      UrlParser.quickAddSeason(
        'https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/NanatsuNoTaizaiMokushirokuNoYonkishi/NanatsuNoTaizaiMokushirokuNoYonkishi_Ep_01_SUB_ITA.mp4',
        24,
        'Stagione 5'
      ),
      UrlParser.quickAddSeason(
        'https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/NanatsuNoTaizaiMokushirokuNoYonkishi2/NanatsuNoTaizaiMokushirokuNoYonkishi2_Ep_01_SUB_ITA.mp4',
        12,
        'Stagione 5 Parte 2'
      )
    ]
  },

  {
    id: 'onepunchmanSUB-ITA',
    title: 'One Punch Man (SUB-ITA)',
    image: 'https://i.imgur.com/dYS7OBW.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv23-yama.sweetpixel.org/DDL/ANIME/OnePunchMan/OnePunchMan_Ep_01_SUB_ITA.mp4',
        12,
        'Stagione 1'
      ),
      UrlParser.quickAddSeason(
        'https://srv30-emiko.sweetpixel.org/DDL/ANIME/OnePunchMan2/OnePunchMan2_Ep_00_SUB_ITA.mp4',
        12,
        'Stagione 2'
      ),
      UrlParser.quickAddSeason(
        'https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/OnePunchMan3/OnePunchMan3_Ep_00_SUB_ITA.mp4',
        12,
        'Stagione 3'
      )
    ]
  },

  {
    id: 'classroomoftheeliteSUB-ITA',
    title: 'Classroom Of The Elite (SUB-ITA)',
    image: 'https://i.imgur.com/rRaQ6KK.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv20-coat.sweetpixel.org/DDL/ANIME/YoukosoJitsuryokuShijouShugiNoKyoushitsu/YoukosoJitsuryokuShijouShugiNoKyoushitsu_Ep_01_SUB_ITA.mp4',
        12,
        'Stagione 1'
      ),
      UrlParser.quickAddSeason(
        'https://srv16-suisen.sweetpixel.org/DDL/ANIME/YoukosoJitsuryokuShijouShugiNoKyoushitsu2/YoukosoJitsuryokuShijouShugiNoKyoushitsu2_Ep_01_SUB_ITA.mp4',
        13,
        'Stagione 2'
      ),
      UrlParser.quickAddSeason(
        'https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/YoukosoJitsuryokuShijouShugiNoKyoushitsu3/YoukosoJitsuryokuShijouShugiNoKyoushitsu3_Ep_01_SUB_ITA.mp4',
        13,
        'Stagione 3'
      )
    ]
  },

  {
    id: 'thegodofhighschoolSUB-ITA',
    title: 'The God of High School (SUB-ITA)',
    image: 'https://i.imgur.com/XxPKTpN.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv19-sushi.sweetpixel.org/DDL/ANIME/TheGodOfHighSchool/TheGodOfHighSchool_Ep_01_SUB_ITA.mp4',
        13,
        'Stagione 1'
      )
    ]
  },

  {
    id: 'fireforceSUB-ITA',
    title: 'Fire Force (SUB-ITA)',
    image: 'https://i.imgur.com/LGWJ778.png',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv29-ayane.sweetpixel.org/DDL/ANIME/FireForce/FireForce_Ep_01_SUB_ITA.mp4',
        24,
        'Stagione 1'
      ),
      UrlParser.quickAddSeason(
        'https://srv27-gordon.sweetpixel.org/DDL/ANIME/FireForce2/FireForce2_Ep_01_SUB_ITA.mp4',
        24,
        'Stagione 2'
      ),
      UrlParser.quickAddSeason(
        'https://srv16-suisen.sweetpixel.org/DDL/ANIME/FireForce3/FireForce3_Ep_01_SUB_ITA.mp4',
        12,
        'Stagione 3'
      )
    ]
  },

  {
    id: 'attackontitanITA',
    title: 'Attack On Titan (ITA)',
    image: 'https://i.imgur.com/ewFfGGg.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason(
        'https://srv17-geisha.sweetpixel.org/DDL/ANIME/ShingekiNoKyojinITA/ShingekiNoKyojin_Ep_01_ITA.mp4',
        25,
        'Stagione 1'
      ),
      UrlParser.quickAddSeason(
        'https://srv28-kokeshi.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin2ITA/ShingekiNoKyojin2_Ep_01_ITA.mp4',
        12,
        'Stagione 2'
      ),
      UrlParser.quickAddSeason(
        'https://srv28-kokeshi.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin3ITA/ShingekiNoKyojin3_Ep_01_ITA.mp4',
        22,
        'Stagione 3'
      ),
      UrlParser.quickAddSeason(
        'https://srv15-cuccia.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin4ITA/ShingekiNoKyojin4_Ep_01_ITA.mp4',
        16,
        'Stagione 4'
      ),
      UrlParser.quickAddSeason(
        'https://srv27-gordon.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin4Part2ITA/ShingekiNoKyojin4Part2_Ep_01_ITA.mp4',
        12,
        'Stagione 4 Parte 2'
      )
    ]
  },

  UrlParser.quickAddSeries(
    'https://srv22-remote.sweetpixel.org/DDL/ANIME/CyberpunkEdgerunners/CyberpunkEdgerunners_Ep_01_SUB_ITA.mp4',
    'Cyberpunk Edgerunners (SUB-ITA)',
    10,
    {
      id: 'cyberpunkSUB-ITA',
      image: 'https://i.imgur.com/fQyYQ4q.jpeg'
    }
  ),

  UrlParser.quickAddSeries(
    'https://srv20-coat.sweetpixel.org/DDL/ANIME/CyberpunkEdgerunnersITA/CyberpunkEdgerunners_Ep_01_ITA.mp4',
    'Cyberpunk Edgerunners (ITA)',
    10,
    {
      id: 'cyberpunkITA',
      image: 'https://i.imgur.com/qE2XtQ1.jpeg'
    }
  ),
  UrlParser.quickAddSeries('https://srv16-suisen.sweetpixel.org/DDL/ANIME/RagnaCrimson/RagnaCrimson_Ep_01_SUB_ITA.mp4', 'Ragna Crimson (SUB-ITA)', 24, {id: 'ragnacrimsonSUB-ITA', image: 'https://i.imgur.com/ULPYYVN.jpeg'}),
  
];


const Catalog = {
  all: CATALOG, // se il tuo array globale si chiama ancora CATALOG

  findById(seriesId) {
    return this.all.find(s => s.id === seriesId) || null;
  }
};
