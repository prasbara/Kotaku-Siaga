// ============================================================
// KotaKu Siaga — Education & Urban Resilience Knowledge Layer
// Standar Ilmiah & Praktis Ketahanan Perkotaan Kota Semarang
// Referensi: BMKG, BNPB, BPBD Semarang, PUPR BBWS, BIG, BRIN
// ============================================================

export interface ScientificReference {
  title: string
  publisher: string
  year: string
  url?: string
  doi?: string
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface EducationModuleItem {
  id: string
  slug: string
  moduleCode: 'MODUL-01' | 'MODUL-02' | 'MODUL-03' | 'MODUL-04'
  overline: string
  title: string
  subtitle: string
  readingTime: string
  category: 'banjir_rob' | 'drainase_perkotaan' | 'kestabilan_lereng' | 'kebakaran'
  targetArea: string
  topographyType: 'pesisir' | 'dataran_rendah' | 'perbukitan' | 'permukiman_padat'
  fivePillars: {
    apa: string
    mengapa: string
    bagaimanaMengenali: string[]
    apaDampaknya: string[]
    apaYangDapatDilakukan: string[]
  }
  diagramType: 'coastal_hydrology' | 'drainage_blockage' | 'slope_stability' | 'fire_propagation'
  riskFactorSliders: {
    label: string
    value: number // 0 - 100
    description: string
  }[]
  dangerSigns: {
    sign: string
    severity: 'kritis' | 'waspada' | 'perhatian'
    fieldNote: string
  }[]
  actionChecklist: {
    sebelum: string[]
    saatTerjadi: string[]
    setelah: string[]
  }
  quiz: QuizQuestion[]
  references: ScientificReference[]
}

export const SCIENTIFIC_GLOSSARY: Record<string, { term: string; definition: string; source: string }> = {
  'land-subsidence': {
    term: 'Land Subsidence (Penurunan Muka Tanah)',
    definition: 'Fenomena penurunan elevasi tanah secara bertahap akibat kompaksi alami sedimen aluvial, beban infrastruktur, dan ekstraksi air tanah berlebih di pesisir Semarang.',
    source: 'Badan Geologi & BRIN Riset Kebencanaan',
  },
  'polder': {
    term: 'Sistem Polder',
    definition: 'Kawasan terisolasi secara hidrologis yang dikelilingi tanggul penahan air, dilengkapi kolam retensi dan pompa mekanis untuk mengalirkan air keluar saat laut pasang.',
    source: 'Kementerian PUPR Ditjen Sumber Daya Air',
  },
  'infiltrasi': {
    term: 'Kapasitas Infiltrasi',
    definition: 'Laju penyerapan air hujan dari permukaan tanah ke dalam pori-pori lapisan tanah, yang menurun drastis ketika tanah tertutup beton atau telah jenuh air.',
    source: 'Hidrologi Terapan BMKG',
  },
  'tekanan-air-pori': {
    term: 'Tekanan Air Pori (Pore Water Pressure)',
    definition: 'Tekanan air yang mengisi rongga di antara butiran tanah pada lereng. Ketika meningkat drastis akibat hujan, gaya geser penahan tanah berkurang drastis memicu longsor.',
    source: 'Mekanika Tanah Geologi Teknik',
  },
  'backwater-effect': {
    term: 'Efek Arus Balik (Backwater Effect)',
    definition: 'Kondisi kenaikan muka air di hulu saluran akibat adanya hambatan hidrolik (sampah, sedimentasi tebal, atau pasang laut) di hilir saluran.',
    source: 'Pedoman Drainase Perkotaan PU',
  },
  'limpasan-permukaan': {
    term: 'Limpasan Permukaan (Surface Runoff)',
    definition: 'Bagian dari curah hujan yang tidak dapat terinfiltrasi ke dalam tanah dan mengalir di atas permukaan jalan atau drainase menuju titik terendah.',
    source: 'Kajian Hidrometeorologi BMKG',
  },
  'kekuatan-geser': {
    term: 'Kekuatan Geser Tanah (Shear Strength)',
    definition: 'Daya tahan internal massa tanah terhadap tegangan geser yang menahan lereng agar tidak runtuh. Menurun saat kadar air mencapai titik jenuh.',
    source: 'Standar Penyelidikan Geoteknik',
  },
  'segitiga-api': {
    term: 'Segitiga Api (Fire Triangle)',
    definition: 'Tiga elemen mutlak yang dibutuhkan untuk memicu dan mempertahankan pembakaran: bahan bakar (fuel), oksigen (oxygen), dan energi panas penyulut (heat). Menghilangkan salah satu elemen akan memadamkan api.',
    source: 'Prinsip Dasar Proteksi Kebakaran Damkar',
  },
  'flashover': {
    term: 'Flashover (Transisi Kilat Kebakaran)',
    definition: 'Fase kritis saat seluruh permukaan bahan mudah terbakar di dalam suatu ruangan mendadak menyala serentak akibat akumulasi radiasi termal dari gas panas di bawah plafon.',
    source: 'Standar Penyelidikan Kebakaran Bangunan',
  },
  'apar-pass': {
    term: 'Prosedur APAR P.A.S.S',
    definition: 'Kaidah standar penggunaan Alat Pemadam Api Ringan: Pull (tarik pin), Aim (arahkan nosel ke dasar api), Squeeze (tekan tuas penyemprot), Sweep (sapukan ke kiri dan ke kanan).',
    source: 'NFPA 10 & Petunjuk Operasional Damkar',
  },
}

export const EDUCATION_MODULES: EducationModuleItem[] = [
  {
    id: 'modul-01',
    slug: 'banjir-rob-dan-dinamika-pesisir',
    moduleCode: 'MODUL-01',
    overline: 'Hidrometeorologi & Drainase Pesisir',
    title: 'Banjir Rob & Dinamika Pesisir Semarang',
    subtitle: 'Memahami interaksi ilmiah antara curah hujan ekstrem, pasang astronomi laut Jawa, penurunan tanah (land subsidence), dan sistem polder pompa.',
    readingTime: '5 menit baca interaktif',
    category: 'banjir_rob',
    targetArea: 'Kawasan Semarang Utara, Genuk, Semarang Timur (Kaligawe, Tambakrejo, Trimulyo, Pelabuhan Tanjung Emas)',
    topographyType: 'pesisir',
    fivePillars: {
      apa: 'Banjir rob dan genangan pesisir adalah luapan air laut atau tergenangnya daratan pesisir yang diakibatkan oleh interaksi gelombang pasang pasang laut maksimum (astronomical tide) dengan air limpasan hujan daratan yang tidak dapat mengalir secara gravitasi ke laut.',
      mengapa: 'Kota Semarang bagian bawah berada pada dataran aluvial muda dengan laju penurunan tanah (land subsidence) berkisar 2-10 cm per tahun. Ketika air laut pasang bersamaan dengan hujan di hulu (Semarang Selatan/Ungaran), muka air laut lebih tinggi dari muka saluran pembuang, sehingga gravitasi terhenti dan air harus dipompa secara mekanis melalui rumah pompa polder (Tenggang, Sringin, Kalibaru).',
      bagaimanaMengenali: [
        'Muka air laut di kanal pelabuhan Tanjung Emas naik melampaui bibir dermaga/tanggul saluran.',
        'Air saluran got perkotaan tidak mengalir ke laut, melainkan berbalik arah (backwater) menuju jalan raya.',
        'Genangan air terasa asin atau payau dan terjadi bahkan saat cuaca setempat sedang cerah berawan.',
        'Informasi pasang surut BMKG Maritim menunjukkan elevasi pasang > +80 cm MSL (Mean Sea Level).',
      ],
      apaDampaknya: [
        'Korosi parah pada rangka kendaraan dan struktur pondasi beton bangunan pemukiman.',
        'Kelumpuhan jalur logistik arteri nasional Pantura (Jl. Raya Kaligawe).',
        'Pencemaran sumber air tawar sumur warga akibat intrusi air asin.',
        'Terganggunya fasilitas pendidikan dan aktivitas ekonomi kawasan industri Terboyo & Genuk.',
      ],
      apaYangDapatDilakukan: [
        'Memantau jadwal pasang surut maritim BMKG Tanjung Emas secara berkala sebelum bepergian.',
        'Meninggikan instalasi kelistrikan rumah minimal 50 cm di atas rekor genangan tertinggi.',
        'Melaporkan titik luapan tanggul bocor melalui aplikasi KotaKu Siaga agar pompa cadangan dapat segera diarahkan.',
        'Mendukung pelestarian sabuk mangrove pesisir sebagai peredam alami energi gelombang laut.',
      ],
    },
    diagramType: 'coastal_hydrology',
    riskFactorSliders: [
      { label: 'Curah Hujan Ekstrem (Hulu/Hilir)', value: 85, description: 'Intensitas hujan > 50 mm/hari memperbesar debit sungai Banjir Kanal Timur & Kali Tenggang.' },
      { label: 'Tinggi Pasang Air Laut (BMKG Tide)', value: 90, description: 'Pasang maksimum > +90 cm MSL menutup aliran pembuangan gravitasi alami.' },
      { label: 'Penurunan Tanah (Land Subsidence)', value: 80, description: 'Laju subsidensi historis 4-8 cm/th menyebabkan daratan semakin rendah dibanding laut.' },
      { label: 'Kapasitas Pompa Polder Aktif', value: 75, description: 'Pompa Sringin & Tenggang menahan genangan dengan kapasitas buang ribuan liter/detik.' },
    ],
    dangerSigns: [
      { sign: 'Air menggenang di jalan raya meskipun tidak ada hujan lokal dalam 6 jam terakhir.', severity: 'kritis', fieldNote: 'Tanda klasik penetrasi pasang rob laut Jawa melalui saluran air perkotaan.' },
      { sign: 'Laju aliran air di sungai Kali Tenggang melambat drastis dan berputar ke arah darat.', severity: 'waspada', fieldNote: 'Indikasi efek arus balik (backwater effect) karena muka laut lebih tinggi.' },
      { sign: 'Lumpur sedimentasi tebal dan buih busa cokelat muncul di mulut gorong-gorong.', severity: 'perhatian', fieldNote: 'Penyumbatan hidrolik lokal yang memerlukan pengaktifan pintu klep otomatis.' },
    ],
    actionChecklist: {
      sebelum: [
        'Ketahui jadwal siklus pasang surut air laut bulanan (terutama saat bulan purnama / fase perigee).',
        'Amankan dokumen penting, surat berharga, dan arsip keluarga dalam wadah kedap air di lantai dua.',
        'Pastikan sekring MCB listrik memiliki pelindung pemutus arus otomatis (ELCB).',
      ],
      saatTerjadi: [
        'Jangan memaksakan kendaraan bermotor roda dua melintasi genangan air laut setinggi lebih dari 20 cm.',
        'Matikan sumber listrik utama jika ketinggian air rob mulai merayap mendekati stop kontak rumah.',
        'Kirimkan laporan koordinat genangan dan taksiran tinggi air melalui aplikasi KotaKu Siaga.',
      ],
      setelah: [
        'Bilas seluruh perabot logam dan kendaraan dengan air tawar bersih sesegera mungkin untuk mencegah karat korosif.',
        'Bersihkan endapan lumpur laut sebelum mengering menjadi kerak keras yang menyumbat sanitasi rumah.',
        'Periksa kembali kelayakan kabel instalasi listrik oleh teknisi berwenang sebelum dinyalakan ulang.',
      ],
    },
    quiz: [
      {
        id: 'q1-1',
        question: 'Manakah kombinasi faktor yang paling akurat memicu terjadinya banjir rob parah di pesisir Semarang?',
        options: [
          'Hanya disebabkan oleh angin kencang di laut lepas.',
          'Kombinasi pasang laut astronomi, land subsidence, curah hujan hulu, dan terhambatnya aliran gravitasi.',
          'Murni akibat masyarakat membuang sampah sembarangan tanpa faktor alam.',
          'Karena suhu udara musim kemarau yang terlalu panas.',
        ],
        correctIndex: 1,
        explanation: 'Banjir rob di Semarang adalah interaksi sistemik antara pasang maksimum laut, penurunan tanah geologis, debit air hujan daratan, dan keterbatasan elevasi alami.',
      },
      {
        id: 'q1-2',
        question: 'Apa fungsi utama stasiun pompa dan polder (seperti Rumah Pompa Sringin dan Tenggang)?',
        options: [
          'Mengalirkan air laut ke pemukiman warga untuk budidaya tambak.',
          'Menyaring air sungai agar langsung bisa diminum tanpa dimasak.',
          'Memompa air limpasan daratan keluar ke laut secara mekanis ketika gravitasi tidak bekerja akibat pasang.',
          'Menurunkan suhu udara di kawasan industri pesisir.',
        ],
        correctIndex: 2,
        explanation: 'Polder dan pompa bekerja saat pasang tinggi menghalangi air sungai mengalir secara gravitasi, sehingga air harus dipaksa keluar menggunakan pompa berkapasitas ribuan liter per detik.',
      },
    ],
    references: [
      { title: 'Kajian Hidrologi dan Penurunan Muka Tanah Pesisir Kota Semarang', publisher: 'Pusat Riset Kebencanaan Geologi BRIN', year: '2024' },
      { title: 'Data Pengamatan Pasang Surut Stasiun Maritim Tanjung Emas', publisher: 'Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)', year: '2025' },
      { title: 'Masterplan Pengendalian Banjir dan Rob Kota Semarang', publisher: 'Balai Besar Wilayah Sungai (BBWS) Pemali-Juana PUPR', year: '2023' },
    ],
  },
  {
    id: 'modul-02',
    slug: 'drainase-dan-sedimentasi-gorong-gorong',
    moduleCode: 'MODUL-02',
    overline: 'Manajemen Aliran Perkotaan',
    title: 'Drainase & Sedimentasi Gorong-Gorong',
    subtitle: 'Menganalisis bagaimana endapan sedimentasi dan penyempitan saluran pada satu titik kritis dapat melumpuhkan daya tampung hidrolik koridor jalan perkotaan.',
    readingTime: '4 menit baca interaktif',
    category: 'drainase_perkotaan',
    targetArea: 'Kawasan Semarang Tengah, Pedurungan, Gayamsari, Semarang Selatan (Jl. Supriyadi, Jl. Majapahit, Simpang Lima, Jl. Gajah Raya)',
    topographyType: 'dataran_rendah',
    fivePillars: {
      apa: 'Genangan perkotaan akibat hambatan drainase adalah meluapnya air hujan ke permukaan jalan dan permukiman karena kapasitas hidrolik saluran tertutup atau gorong-gorong lebih kecil dari debit puncak aliran limpasan.',
      mengapa: 'Saluran air kota dirancang dengan dimensi tertentu untuk menampung curah hujan rencana. Namun endapan lumpur tebal (sedimentasi), penumpukan sampah anorganik di mulut inlet, serta penutupan liar plat saluran oleh bangunan komersial memperkecil luas penampang basah (hydraulic cross-section), menimbulkan efek leher botol (bottleneck) dan arus balik.',
      bagaimanaMengenali: [
        'Air hujan di badan jalan tidak langsung masuk ke mulut tali air (inlet grill) dan mengalir lambat.',
        'Terlihat tumpukan sampah plastik yang menempel di jeruji inlet gorong-gorong saat hujan berlangsung.',
        'Muka air di dalam saluran got penuh meluap, padahal saluran primer di ujung jalan masih memiliki ruang kosong.',
        'Genangan air di aspal bertahan lebih dari 45 menit setelah intensitas hujan mulai mereda.',
      ],
      apaDampaknya: [
        'Aspal jalan cepat berlubang dan mengelupas akibat perlemahan ikatan aspal oleh genangan air.',
        'Macet total pada koridor ekonomi utama perkotaan (misalnya Jl. Supriyadi & Jl. Majapahit).',
        'Potensi penyebaran bibit penyakit leptospirosis dan jentik nyamuk demam berdarah.',
        'Kerusakan interior bangunan ruko dan rumah warga di sepanjang bibir jalan.',
      ],
      apaYangDapatDilakukan: [
        'Tidak menutup seluruh saluran pembuang di depan rumah dengan beton mati tanpa bak kontrol (manhole).',
        'Melakukan kerja bakti pengerukan sedimen lumpur got pemukiman sebelum musim hujan tiba.',
        'Memasang saringan sampah jeruji (trash trap) mandiri di parit lingkungan.',
        'Mengambil foto sumbatan dan melaporkan titik penyempitan saluran melalui fitur Lapor KotaKu Siaga.',
      ],
    },
    diagramType: 'drainage_blockage',
    riskFactorSliders: [
      { label: 'Intensitas Hujan Sesaat (Peak Rain)', value: 80, description: 'Hujan deras lebat singkat menghasilkan limpasan puncak seketika.' },
      { label: 'Ketebalan Sedimentasi Lumpur', value: 70, description: 'Endapan lumpur memenuhi 30-60% kedalaman dasar saluran gorong-gorong.' },
      { label: 'Sampah Anorganik Penghambat Inlet', value: 75, description: 'Kantong plastik dan sampah menyumbat jeruji besi saringan saluran.' },
      { label: 'Tingkat Tutupan Lahan Kedap Air', value: 85, description: 'Banyaknya aspal dan paving membuat 80% air hujan menjadi limpasan tanpa meresap.' },
    ],
    dangerSigns: [
      { sign: 'Air menggelembung naik keluar dari manhole tutup besi di tengah jalan.', severity: 'kritis', fieldNote: 'Tanda tekanan balik hidrolik (backpressure) akibat sumbatan total di bagian hilir.' },
      { sign: 'Inlet tali air jalan tertutup tumpukan daun gugur dan kantong plastik.', severity: 'waspada', fieldNote: 'Penyebab tercepat terjadinya genangan lokal di bahu jalan raya.' },
      { sign: 'Bau belerang atau gas busuk menyengat dari gorong-gorong saat mendung.', severity: 'perhatian', fieldNote: 'Indikasi dekomposisi anaerobik sampah tebal yang telah mengendap lama.' },
    ],
    actionChecklist: {
      sebelum: [
        'Pastikan bak kontrol di depan pagar rumah dapat dibuka dengan mudah untuk inspeksi berkala.',
        'Bersihkan sampah daun dan plastik yang menumpuk di depan mulut saluran air pemukiman.',
        'Laporkan kepada pengurus RT/RW atau dinas PU jika menemukan gorong-gorong ambles.',
      ],
      saatTerjadi: [
        'Waspadai lubang saluran yang tutupnya terbuka terbawa arus air genangan di jalan raya.',
        'Jangan membuka paksa grill besi penutup gorong-gorong tanpa pengaman karena risiko tersedot arus.',
        'Bantu pasang rambu peringatan darurat jika terdapat lubang got yang tergenang air.',
      ],
      setelah: [
        'Segera bersihkan lumpur endapan yang tertinggal di halaman rumah sebelum mengering mengeras.',
        'Cek aliran air di parit setelah surut, tandai titik di mana aliran masih tergenang untuk dibersihkan.',
        'Koordinasikan penyemprotan disinfektan lingkungan pemukiman dengan puskesmas setempat.',
      ],
    },
    quiz: [
      {
        id: 'q2-1',
        question: 'Apa akibat utama dari penutupan total saluran drainase di depan ruko dengan semen beton permanen tanpa lubang kontrol?',
        options: [
          'Membuat saluran lebih bersih karena tidak ada udara yang masuk.',
          'Menghambat pembersihan lumpur berkala dan menyulitkan identifikasi titik penyumbatan sampah.',
          'Meningkatkan kecepatan aliran air menuju sungai hingga dua kali lipat.',
          'Mencegah terjadinya penurunan permukaan tanah di sekitar jalan.',
        ],
        correctIndex: 1,
        explanation: 'Saluran yang dicor mati tanpa bak kontrol (manhole) mencegah petugas dan warga mengeruk endapan lumpur, sehingga ketika tersumbat sampah, air akan meluap tanpa bisa diperbaiki dari luar.',
      },
      {
        id: 'q2-2',
        question: 'Rantai sebab-akibat manakah yang paling tepat menjelaskan genangan akibat sedimentasi gorong-gorong?',
        options: [
          'Aliran bertambah deras -> Muka air turun -> Air langsung kering.',
          'Aliran berkurang -> Muka air naik -> Limpasan meningkat -> Genangan meluas.',
          'Air laut pasang -> Saluran menjadi bersih -> Air mengalir lancar.',
          'Hujan turun -> Tekanan udara naik -> Air terserap seketika.',
        ],
        correctIndex: 1,
        explanation: 'Ketika penampang saluran terhambat sedimen, kapasitas debit berkurang, air tertahan dan naik ke permukaan jalan, menimbulkan limpasan banjir lokal meluas.',
      },
    ],
    references: [
      { title: 'Tata Cara Perencanaan Sistem Drainase Perkotaan (SNI 02-2406)', publisher: 'Badan Standardisasi Nasional & Kementerian PUPR', year: '2023' },
      { title: 'Laporan Kinerja Pengelolaan Drainase dan Pembersihan Sedimen', publisher: 'Dinas Pekerjaan Umum Kota Semarang', year: '2025' },
    ],
  },
  {
    id: 'modul-03',
    slug: 'kestabilan-lereng-dan-erosi-perbukitan',
    moduleCode: 'MODUL-03',
    overline: 'Geologi Terapan & Tebing',
    title: 'Kestabilan Lereng & Erosi Perbukitan',
    subtitle: 'Memahami sains mekanika tanah, peningkatan tekanan air pori, hilangnya gaya geser tanah, dan tanda dini bahaya longsor di perbukitan Semarang Selatan.',
    readingTime: '5 menit baca interaktif',
    category: 'kestabilan_lereng',
    targetArea: 'Kawasan Semarang Atas, Gombel, Banyumanik, Candisari, Gajahmungkur, Tembalang, Gunungpati',
    topographyType: 'perbukitan',
    fivePillars: {
      apa: 'Gerakan tanah atau longsor adalah perpindahan massa batuan, bahan rombakan, atau tanah pembentuk lereng menuruni lereng akibat gaya gravitasi bumi saat gaya pendorong melampaui gaya penahan pada bidang gelincir.',
      mengapa: 'Formasi geologi perbukitan Semarang tersusun atas batuan napal dan lempung formasi Damar dan Kalibiuk yang peka terhadap pelapukan. Saat hujan deras berhari-hari, infiltrasi air membuat tanah jenuh, menaikkan bobot massa lereng dan melipatgandakan tekanan air pori. Akibatnya, kekuatan geser (shear strength) penahan tanah hancur seketika memicu luncuran massa tanah.',
      bagaimanaMengenali: [
        'Munculnya retakan baru berbentuk tapal kuda pada tanah lereng, jalan aspal, atau lantai rumah.',
        'Pintu dan jendela bangunan di lereng mendadak macet atau sulit ditutup karena pergeseran kusen pondasi.',
        'Tiang listrik, tiang telepon, atau pepohonan di lereng mulai terlihat condong ke arah bawah.',
        'Tiba-tiba muncul mata air baru atau rembesan air keruh kecokelatan di tebing yang sebelumnya kering.',
      ],
      apaDampaknya: [
        'Kerusakan parah atau hancurnya struktur bangunan hunian di bibir tebing maupun di kaki lereng.',
        'Tertutupnya jalur transportasi vital Semarang Bawah – Semarang Atas (misalnya turunan Tanah Putih / Gombel).',
        'Korban jiwa akibat runtuhan material tanah berkecepatan tinggi yang terjadi secara mendadak.',
        'Kerusakan instalasi pipa air PDAM dan jaringan kabel listrik bawah tanah.',
      ],
      apaYangDapatDilakukan: [
        'Tidak memotong tebing secara tegak lurus (90 derajat) untuk membangun bangunan tanpa talud penguat bertingkat.',
        'Membuat saluran drainase permukaan teratur di lereng agar air hujan langsung mengalir tanpa meresap liar ke lereng.',
        'Menanam vegetasi berakar serabut kuat dan akar tunjang dalam (vetiver, bambu petung, pohon aren) di lereng terjal.',
        'Segera mengungsi jika mendengar suara gemuruh dari arah tebing saat hujan lebat lebih dari dua jam.',
      ],
    },
    diagramType: 'slope_stability',
    riskFactorSliders: [
      { label: 'Kemiringan Lereng (> 25 Derajat)', value: 85, description: 'Semakin terjal sudut lereng, semakin besar komponen gravitasi pendorong massa tanah.' },
      { label: 'Curah Hujan Kumulatif 3 Hari Terakhir', value: 80, description: 'Hujan terus-menerus menjenuhkan pori tanah hingga mencapai batas cair (liquid limit).' },
      { label: 'Kerapatan Vegetasi Pengikat Akar', value: 50, description: 'Alih fungsi lahan menjadi pemukiman mengurangi ikatan mekanis akar pohon penahan tebing.' },
      { label: 'Sistem Drainase Sulingan Talud', value: 65, description: 'Pipa sulingan (weep holes) pada dinding penahan tanah mencegah akumulasi tekanan air pori.' },
    ],
    dangerSigns: [
      { sign: 'Suara retakan kayu, genteng berderak, atau suara gemuruh dari dalam tebing.', severity: 'kritis', fieldNote: 'Tanda pergerakan mekanis aktif pada bidang gelincir bawah tanah yang sangat genting.' },
      { sign: 'Air rembesan di kaki lereng mendadak berubah menjadi sangat keruh dan berlumpur.', severity: 'kritis', fieldNote: 'Mengindikasikan partikel tanah halus sedang tersapu erosi bawah tanah (piping erosion).' },
      { sign: 'Retakan rambut di plester dinding dan halaman yang melebar dari hari ke hari.', severity: 'waspada', fieldNote: 'Pergerakan tanah bertahap (soil creep) yang menandakan lereng berada dalam kondisi labil.' },
    ],
    actionChecklist: {
      sebelum: [
        'Periksa saluran air di sekitar lereng, pastikan tidak ada air yang bocor merembes langsung ke dalam tanah tebing.',
        'Amati retakan tanah di sekitar rumah secara berkala, pasang patok ukur sederhana untuk memantau pergeseran.',
        'Sepakati jalur evakuasi aman keluarga menuju tempat datar yang jauh dari arah luncuran lereng.',
      ],
      saatTerjadi: [
        'Jika mendengar suara gemuruh atau melihat tanda tanah merekah, segera tinggalkan rumah tanpa menunda.',
        'Lari menjauhi arah runtuhan ke arah samping lereng (tegak lurus arah longsor), jangan berlari ke bawah jalur luncur.',
        'Hubungi layanan darurat 112 dan posko BPBD Kota Semarang untuk bantuan tim penyelamat.',
      ],
      setelah: [
        'Jangan langsung mendekati area longsoran karena tanah susulan sering terjadi saat lereng belum stabil.',
        'Bantu petugas menandai perimeter bahaya dengan tali pengaman agar warga lain tidak mendekat.',
        'Ikuti arahan geolog BPBD sebelum memutuskan untuk kembali menempati hunian di area tebing.',
      ],
    },
    quiz: [
      {
        id: 'q3-1',
        question: 'Bagaimana air hujan yang meresap ke dalam lereng dapat memicu terjadinya tanah longsor?',
        options: [
          'Air hujan membuat tanah menjadi sangat kering sehingga mudah terbakar.',
          'Air menaikkan bobot massa tanah dan meningkatkan tekanan air pori sehingga kekuatan geser penahan tanah menurun.',
          'Air hujan langsung mengubah lapisan tanah menjadi batu karang yang keras.',
          'Air hujan menarik partikel tanah menuju ke arah hulu sungai.',
        ],
        correctIndex: 1,
        explanation: 'Infiltrasi berlebih membuat tanah jenuh. Berat massa bertambah dan tekanan air di sela-sela butiran tanah (tekanan air pori) menolak butiran tanah saling mengikat, melumpuhkan kekuatan geser penahan lereng.',
      },
      {
        id: 'q3-2',
        question: 'Jika Anda berada di lereng perbukitan dan melihat pohon miring serta air di kaki lereng mendadak keruh saat hujan lebat, tindakan paling tepat adalah:',
        options: [
          'Mendekati tebing untuk mengambil video siaran langsung di media sosial.',
          'Mencoba menyiram tebing dengan air bersih agar tidak keruh lagi.',
          'Segera mengungsi menjauhi arah luncuran lereng bersama keluarga dan menghubungi 112 BPBD.',
          'Tidur di dalam kamar lantai satu menunggu hujan reda.',
        ],
        correctIndex: 2,
        explanation: 'Pohon miring dan rembesan air keruh adalah indikator risiko tinggi pergerakan massa tanah. Keselamatan jiwa adalah prioritas utama dengan segera mengungsi ke tempat aman.',
      },
    ],
    references: [
      { title: 'Peta Zona Kerentanan Gerakan Tanah Kota Semarang', publisher: 'Pusat Vulkanologi dan Mitigasi Bencana Geologi (PVMBG)', year: '2024' },
      { title: 'Pedoman Penataan Ruang Kawasan Rawan Bencana Longsor', publisher: 'Kementerian Agraria dan Tata Ruang / BPN', year: '2023' },
      { title: 'Rencana Penanggulangan Bencana Kota Semarang 2022-2026', publisher: 'BPBD Kota Semarang', year: '2024' },
    ],
  },
  {
    id: 'modul-04',
    slug: 'kebakaran-permukiman-dan-lahan-kering',
    moduleCode: 'MODUL-04',
    overline: 'Proteksi Kebakaran & APAR',
    title: 'Mitigasi Kebakaran Permukiman & Lahan Kering',
    subtitle: 'Memahami sains pemicu kebakaran korsleting listrik di lorong padat hunian, pencegahan api loncat lahan ilalang kering, dan penguasaan APAR mandiri.',
    readingTime: '5 menit baca interaktif',
    category: 'kebakaran',
    targetArea: 'Kawasan Semarang Tengah (Pecinan, Kauman), Gayamsari, Mijen, Banyumanik (ilalang perbukitan)',
    topographyType: 'permukiman_padat',
    fivePillars: {
      apa: 'Kebakaran perkotaan dan lahan kering adalah reaksi pembakaran tak terkendali yang dipicu interaksi bahan mudah terbakar, oksigen melimpah, dan panas pemicu (segitiga api), merambat cepat melalui konveksi udara panas dan radiasi termal.',
      mengapa: 'Pada musim kemarau di Semarang, suhu udara tinggi (> 34°C) dan kelembapan rendah mengeringkan vegetasi ilalang. Di permukiman padat bersejarah seperti Pecinan dan Kauman, instalasi listrik kabel serabut yang kelebihan beban (overload) ditambah dinding bangunan yang saling menempel membuat api mudah melompat tanpa sekat pemutus.',
      bagaimanaMengenali: [
        'Bau sangit isolasi kabel plastik terbakar atau lampu di rumah sering berkedip saat beban alat elektronik naik.',
        'Asap pekat abu-abu tebal membubung dari ventilasi atau atap rumah di sekitar lingkungan.',
        'Terdengar suara letupan beruntun dari kabel tiang listrik atau sekring MCB yang tidak memutus otomatis.',
        'Bara api melayang terbawa angin kencang di area semak ilalang kering perbukitan.',
      ],
      apaDampaknya: [
        'Kerugian material aset hunian, pertokoan, dan terhentinya mata pencaharian warga.',
        'Ancaman cedera luka bakar dan keracunan gas monoksida (CO) bagi penghuni lansia dan anak-anak.',
        'Pemadaman listrik darurat bergilir oleh PLN untuk mengisolasi jaringan tegangan tinggi.',
        'Hambatan akses armada pemadam karena lorong pemukiman sempit terhalang parkir liar.',
      ],
      apaYangDapatDilakukan: [
        'Menggunakan kabel berstandar SNI dan tidak menumpuk steker cabang listrik (T-steker) secara berlebihan.',
        'Menyediakan minimal 1 tabung APAR Dry Chemical Powder 3 kg di setiap rumah atau pos ronda RT.',
        'Membuat sekat bakar pembersih ilalang selebar 3-5 meter di batas kebun kering dan perumahan.',
        'Segera evakuasi merunduk dan telepon hotline darurat Damkar Kota Semarang 113 / Call Center 112.',
      ],
    },
    diagramType: 'fire_propagation',
    riskFactorSliders: [
      { label: 'Kepadatan Bangunan & Material Kayu', value: 85, description: 'Jarak antar bangunan < 1 meter mempercepat transmisi panas radiasi ke tetangga.' },
      { label: 'Beban Arus Listrik Non-Standar (Overload)', value: 80, description: 'Kabel serabut kecil dipaksa menyuplai AC, mesin pompa, dan pemanas air bersamaan.' },
      { label: 'Aksesibilitas Mobil Damkar (Lebar Gang)', value: 45, description: 'Gang pemukiman < 2.5 meter memperlambat gelar selang air pemadam kebakaran.' },
      { label: 'Suhu Udara Kemarau & Angin Muson', value: 75, description: 'Kecepatan angin mempercepat pembesaran kobaran api di lahan semak kering.' },
    ],
    dangerSigns: [
      { sign: 'Stop kontak dinding terasa panas saat disentuh dan mengeluarkan bau gosong.', severity: 'kritis', fieldNote: 'Tanda arus pendek lokal aktif yang dapat menyulut api ke triplek atau gorden dalam hitungan detik.' },
      { sign: 'Asap hitam tebal dan udara di dekat pintu ruangan terasa mendadak sangat panas.', severity: 'kritis', fieldNote: 'Indikasi ruangan mendekati tahap kilat (flashover). Jangan buka pintu sembarangan!' },
      { sign: 'Bara api tertiup angin melompati jalan selebar 4 meter menuju kebun kering.', severity: 'waspada', fieldNote: 'Fenomena spotting fire yang memerlukan pembuatan sekat bakar basah segera.' },
    ],
    actionChecklist: {
      sebelum: [
        'Lakukan pemeriksaan instalasi kelistrikan berkala minimal tiap 5 tahun oleh instalatur resmi bersertifikat.',
        'Pastikan nomor telepon Pos Damkar terdekat (113) tercatat di dekat pintu keluar rumah.',
        'Latih seluruh anggota keluarga cara mengoperasikan pin dan tuas APAR dengan prinsip P.A.S.S.',
      ],
      saatTerjadi: [
        'Jika api masih berukuran kecil, padamkan segera menggunakan APAR atau karung goni basah dari arah membelakangi angin.',
        'Jika api membesar atau tercium asap tebal, segera evakuasi dengan cara merunduk merayap dekat lantai.',
        'Tutup pintu kamar saat keluar untuk memperlambat suplai oksigen ke titik api (contain the fire).',
        'Hubungi Damkar 113 dan BPBD 112 sebutkan alamat jelas, patokan lokasi, dan ada/tidaknya korban terjebak.',
      ],
      setelah: [
        'Jangan kembali masuk ke dalam bangunan sebelum dinyatakan aman dan dingin oleh komandan regu pemadam.',
        'Waspadai potensi gas beracun yang masih tertahan di sudut ruangan tanpa sirkulasi udara.',
        'Laporkan insiden ke pengurus lingkungan dan koordinasikan posko logistik darurat.',
      ],
    },
    quiz: [
      {
        id: 'q4-1',
        question: 'Mengapa menyiram air secara langsung pada kebakaran yang bersumber dari korsleting panel listrik sangat berbahaya?',
        options: [
          'Karena air membuat api menjadi semakin harum.',
          'Karena air dapat menghantarkan arus listrik bertegangan tinggi yang menyengat orang yang menyiram.',
          'Karena air membuat kabel listrik menjadi dingin terlalu cepat.',
          'Karena air akan merusak dinding rumah tetangga.',
        ],
        correctIndex: 1,
        explanation: 'Air tawar adalah konduktor listrik. Menyiram air ke instalasi beraliran listrik aktif berisiko fatal menyengat penolong. Gunakan APAR jenis Dry Chemical Powder, gas CO2, atau matikan MCB terlebih dahulu.',
      },
      {
        id: 'q4-2',
        question: 'Dalam kaidah pengoperasian APAR P.A.S.S, ke manakah arah semprotan nosel harus ditujukan?',
        options: [
          'Ke puncak kobaran lidah api paling atas.',
          'Ke arah langit-langit ruangan.',
          'Ke dasar bahan yang terbakar (base of the fire) dengan sapuan mendatar.',
          'Ke arah jendela kaca yang tertutup.',
        ],
        correctIndex: 2,
        explanation: 'Semprotan bahan pemadam APAR harus diarahkan ke dasar bahan yang terbakar (base of fire) agar memutus suplai segitiga api, bukan ke asap atau puncak kobaran api.',
      },
    ],
    references: [
      { title: 'Pedoman Penanggulangan Bahaya Kebakaran di Lingkungan Perumahan', publisher: 'Dinas Pemadam Kebakaran Kota Semarang', year: '2025' },
      { title: 'SNI 03-3987: Tata Cara Perencanaan dan Pemasangan Sistem Pemadam Api Ringan', publisher: 'Badan Standardisasi Nasional (BSN)', year: '2023' },
      { title: 'Kajian Kerentanan Kebakaran Permukiman Padat Perkotaan', publisher: 'Pusat Riset Kebencanaan BRIN', year: '2024' },
    ],
  },
]

// Mapping helper to connect map/report location coordinates or category to education modules
export function getRecommendedModuleForLocation(lat: number, lng: number, category?: string): EducationModuleItem {
  // 1. By category first if explicit
  if (category === 'kebakaran') {
    return EDUCATION_MODULES[3] // Kebakaran permukiman & lahan kering
  }
  if (category === 'longsor') {
    return EDUCATION_MODULES[2] // Kestabilan lereng
  }
  if (category === 'drainase_tersumbat' || category === 'sampah') {
    return EDUCATION_MODULES[1] // Drainase & sedimentasi
  }
  if (category === 'banjir' || category === 'infrastruktur_rusak') {
    // If southern latitude (hilly) -> Modul 3, else coastal -> Modul 1
    if (lat < -7.02) {
      return EDUCATION_MODULES[2] // Semarang Atas
    }
    return EDUCATION_MODULES[0] // Banjir rob pesisir
  }

  // 2. Spatial heuristic based on latitude in Semarang
  // Coastal/North: > -6.98 (Semarang Utara, Genuk)
  // Lowland/Central: -6.98 to -7.03 (Semarang Tengah, Pedurungan, Gayamsari)
  // Hilly/South: < -7.03 (Candisari, Gombel, Tembalang, Banyumanik)
  if (lat > -6.98) {
    return EDUCATION_MODULES[0] // Pesisir
  } else if (lat < -7.03) {
    return EDUCATION_MODULES[2] // Perbukitan
  } else {
    return EDUCATION_MODULES[1] // Urban drainage
  }
}
