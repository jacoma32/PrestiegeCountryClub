// Product names identify real gear. The colors and finishes are in-game interpretations.
const polo=(id,brand,name,price,color,pattern)=>({id,brand,name,slot:'shirt',price,color,pattern});
const ball=(id,brand,name,price,color='#f9f9f3')=>({id,brand,name,slot:'ball',price,color});
const hat=(id,brand,name,price,color)=>({id,brand,name,slot:'hat',price,color});
const bag=(id,brand,name,price,color,trim,stand=true)=>({id,brand,name,slot:'bag',price,color,trim,stand});
const clubs=(id,brand,name,price,color,accent)=>({id,brand,name,slot:'clubs',price,color,accent});

const ironCollection=(id,brand,name,price,color,accent)=>({id,brand,name,slot:'irons',price,color,accent});

export const brandedGear=[
 polo('nike-victory','Nike','Dri-FIT Victory',0,'#edf0ef'),
 polo('nike-tour','Nike','Dri-FIT Tour',85,'#457199','dot'),
 polo('adidas-365','adidas','Ultimate365',65,'#1e3356'),
 polo('adidas-tour','adidas','Ultimate365 Tour',110,'#79374a','windowpane'),
 polo('ua-playoff','Under Armour','Playoff 3.0',65,'#b3c8e2','pinstripe'),
 polo('ua-t2g','Under Armour','T2G',70,'#233542'),
 polo('fj-lisle','FootJoy','ProDry Lisle',90,'#6981a4','twin'),
 polo('fj-pique','FootJoy','Piqué Solid',80,'#8f3247'),
 polo('puma-mattr','PUMA','MATTR Tropic',95,'#a7c9a9','cross'),
 polo('puma-cloudspun','PUMA','CLOUDSPUN',60,'#244737'),
 polo('tm-heater','TravisMathew','The Heater',95,'#335168'),
 polo('tm-zinna','TravisMathew','The Zinna',110,'#c5b6a0','pinstripe'),
 polo('pm-owens','Peter Millar','Owens Performance Jersey',130,'#6488ba','twin'),
 polo('pm-coastline','Peter Millar','Coastline Performance Jersey',145,'#e9edf0','wave'),
 polo('callaway-optidri','Callaway','Opti-Dri Solid',55,'#0d6253'),
 polo('rl-airflow','RLX Ralph Lauren','Airflow Jersey',125,'#742d45','dot'),

 ball('titleist-prov1','Titleist','Pro V1',65),
 ball('titleist-prov1x','Titleist','Pro V1x',65),
 ball('titleist-avx','Titleist','AVX',55),
 ball('titleist-tour-soft','Titleist','Tour Soft',45),
 ball('titleist-velocity','Titleist','Velocity',40,'#ff8537'),
 ball('titleist-trufeel','Titleist','TruFeel',0),
 ball('callaway-chrome-tour','Callaway','Chrome Tour',65),
 ball('callaway-chrome-tour-x','Callaway','Chrome Tour X',70),
 ball('callaway-chrome-soft','Callaway','Chrome Soft',60),
 ball('callaway-supersoft','Callaway','Supersoft',35,'#f1e240'),
 ball('callaway-erc-soft','Callaway','ERC Soft',50),
 ball('taylormade-tp5','TaylorMade','TP5',65),
 ball('taylormade-tp5x','TaylorMade','TP5x',70),
 ball('taylormade-tour-response','TaylorMade','Tour Response',55),
 ball('taylormade-speedsoft','TaylorMade','SpeedSoft',35,'#e9da42'),
 ball('taylormade-distance','TaylorMade','Distance+',30),
 ball('srixon-zstar','Srixon','Z-STAR',55),
 ball('srixon-zstar-xv','Srixon','Z-STAR XV',60),
 ball('srixon-qstar-tour','Srixon','Q-STAR TOUR',45),
 ball('srixon-soft-feel','Srixon','SOFT FEEL',35,'#f3e845'),
 ball('bridgestone-tour-bx','Bridgestone','TOUR B X',65),
 ball('bridgestone-tour-bxs','Bridgestone','TOUR B XS',65),
 ball('bridgestone-e12','Bridgestone','e12 CONTACT',45),
 ball('vice-pro','Vice Golf','Pro',50,'#f2e638'),
 ball('vice-pro-plus','Vice Golf','Pro Plus',55),
 ball('wilson-staff-model','Wilson','Staff Model',55),

 hat('titleist-tour-performance','Titleist','Tour Performance',0,'#213b45'),
 hat('titleist-tour-rope','Titleist','Tour Rope',65,'#efe4d0'),
 hat('titleist-players-performance','Titleist','Players Performance Ball Marker',55,'#263049'),
 hat('callaway-performance-pro','Callaway','Performance Pro',55,'#387082'),
 hat('callaway-tour-authentic','Callaway','Tour Authentic',70,'#151f2e'),
 hat('taylormade-tour-radar','TaylorMade','Tour Radar',55,'#cfcbc4'),
 hat('taylormade-tour-flatbill','TaylorMade','Tour Flatbill',65,'#6e2734'),
 hat('ping-tour-classic','PING','Tour Classic',60,'#24395b'),
 hat('ping-tour-structured','PING','Tour Structured',65,'#455a46'),
 hat('nike-club','Nike','Dri-FIT Club',45,'#33383e'),
 hat('nike-ace','Nike','Dri-FIT Ace',60,'#265568'),
 hat('adidas-tour-snapback','adidas','Tour Snapback',50,'#e4dac4'),
 hat('puma-p','PUMA','P Cap',55,'#b3562b'),
 hat('fj-tour-cap','FootJoy','Tour Cap',50,'#f4f0e5'),

 bag('titleist-players4','Titleist','Players 4',0,'#17262f','#8d999f'),
 bag('titleist-players4-stadry','Titleist','Players 4 StaDry',135,'#244567','#b9c6d2'),
 bag('titleist-cart14','Titleist','Cart 14',115,'#252932','#c32e3a',false),
 bag('callaway-fairway-c','Callaway','Fairway C',95,'#657665','#dedacb'),
 bag('callaway-fairway14','Callaway','Fairway 14',120,'#223045','#a5b4c7'),
 bag('callaway-org14','Callaway','ORG 14',145,'#b9aa94','#37312e',false),
 bag('taylormade-flextech','TaylorMade','FlexTech Crossover',120,'#224b73','#dddfdf'),
 bag('taylormade-pro-cart','TaylorMade','Pro Cart',100,'#41434c','#d64640',false),
 bag('ping-hoofer','PING','Hoofer',105,'#3d4142','#d8cfc0'),
 bag('ping-hoofer-lite','PING','Hoofer Lite',115,'#4c5f82','#d6edeb'),
 bag('ping-pioneer','PING','Pioneer',145,'#152b38','#60989d',false),
 bag('ping-traverse','PING','Traverse',130,'#7f283c','#dbb7aa',false),
 bag('sun-mountain-25','Sun Mountain','2.5+ Stand Bag',105,'#453750','#ccb756'),
 bag('sun-mountain-45','Sun Mountain','4.5 LS Stand Bag',140,'#485363','#c85e30'),
 bag('vessel-player-v','VESSEL','Player V Stand Bag',195,'#e0ded5','#383835'),
 bag('jones-trouper','Jones','Trouper',155,'#5b6248','#bfb394'),

 ironCollection('titleist-t100','Titleist','T100 Irons',235,'#c1c7cc','#2f333a'),
 ironCollection('titleist-t150','Titleist','T150 Irons',225,'#b9c2c8','#5a3036'),
 ironCollection('titleist-t250','Titleist','T250 Irons',215,'#aab6c2','#39484f'),
 ironCollection('callaway-ai200','Callaway','Apex Ai200 Irons',210,'#b3c5cf','#375662'),
 ironCollection('callaway-ai300','Callaway','Apex Ai300 Irons',220,'#bfcbca','#2e5c58'),
 ironCollection('callaway-elyte','Callaway','Elyte Irons',185,'#aeb9c1','#316348'),
 ironCollection('taylormade-p790','TaylorMade','P·790 Irons',230,'#c2c7cc','#262c39'),
 ironCollection('taylormade-p770','TaylorMade','P·770 Irons',245,'#c2c9cf','#303f54'),
 ironCollection('taylormade-qi','TaylorMade','Qi Irons',180,'#abb4bd','#365068'),
 ironCollection('ping-g440','PING','G440 Irons',195,'#b4bfc7','#295b78'),
 ironCollection('ping-i530','PING','i530 Irons',220,'#b5bec6','#50505a'),
 ironCollection('ping-blueprint-s','PING','Blueprint S Irons',245,'#c1c5c7','#2f3c4c'),
 ironCollection('mizuno-jpx925','Mizuno','JPX 925 Hot Metal Irons',205,'#a8b7c1','#3b5e94'),
 ironCollection('srixon-zxi5','Srixon','ZXi5 Irons',215,'#b2c0c7','#624146'),
 ironCollection('cobra-king','Cobra','KING TEC Irons',220,'#aab6bc','#365343'),
 ironCollection('wilson-dynapower','Wilson','Dynapower Irons',175,'#b5c1c6','#603639'),
 clubs('wilson-profile','Wilson','Profile SGI Complete Set',0,'#b8c2ca','#393e4b')
];

const singleClub=(id,slot,brand,name,price,color,accent,blade=false)=>({id,slot,brand,name,price,color,accent,blade});
brandedGear.push(
 singleClub('titleist-gt2-driver','driver','Titleist','GT2 Driver',210,'#aeb6be','#252936'),
 singleClub('callaway-elyte-driver','driver','Callaway','Elyte Driver',205,'#bbc5c8','#397d56'),
 singleClub('taylormade-qi35-driver','driver','TaylorMade','Qi35 Driver',225,'#b2b9bf','#42404d'),
 singleClub('ping-g440-driver','driver','PING','G440 MAX Driver',220,'#c8d0d0','#235a89'),
 singleClub('cobra-ds-adapt-driver','driver','Cobra','DS-ADAPT MAX-K Driver',195,'#adb5be','#5d75a4'),

 singleClub('titleist-gt2-fairway','wood','Titleist','GT2 Fairway',145,'#c0c5ca','#252838'),
 singleClub('callaway-elyte-fairway','wood','Callaway','Elyte Fairway Wood',140,'#bdc7c8','#35682d'),
 singleClub('taylormade-qi35-fairway','wood','TaylorMade','Qi35 Fairway',155,'#b3bbc2','#524756'),
 singleClub('ping-g440-fairway','wood','PING','G440 MAX Fairway',150,'#c4cdd1','#3b7398'),

 singleClub('titleist-gt2-hybrid','hybrid','Titleist','GT2 Hybrid',120,'#aeb4bc','#373039'),
 singleClub('callaway-elyte-hybrid','hybrid','Callaway','Elyte Hybrid',115,'#bfd0d0','#478a51'),
 singleClub('taylormade-qi35-rescue','hybrid','TaylorMade','Qi35 Rescue',130,'#aeb8c2','#485269'),
 singleClub('ping-g440-hybrid','hybrid','PING','G440 Hybrid',125,'#c2ced8','#376e9c'),

 singleClub('prestige-cavity-iron','irons','Callaway','Paradym Ai Smoke Irons',145,'#bdc5c8','#294a39'),
 singleClub('prestige-tour-iron','irons','Wilson','Staff Model CB Irons',185,'#d4d5cb','#574628'),
 singleClub('vokey-sm10','wedges','Titleist','Vokey SM10 Tour Chrome',115,'#c6c9c8','#555761'),
 singleClub('callaway-opus','wedges','Callaway','Opus Brushed Chrome',105,'#bcc5cb','#475a64'),
 singleClub('taylormade-mg4','wedges','TaylorMade','Milled Grind 4',110,'#b7c1c7','#63646b'),
 singleClub('ping-s159','wedges','PING','s159 Chrome',105,'#c2cbcf','#425668'),
 singleClub('cleveland-rtz','wedges','Cleveland Golf','RTZ Tour Satin',110,'#cad0d2','#545c64'),

 singleClub('scotty-newport2','putter','Scotty Cameron','Studio Style Newport 2',175,'#c6cbca','#25484a',true),
 singleClub('odyssey-aione-seven','putter','Odyssey','Ai-ONE #7',145,'#afd0e6','#2a4b73'),
 singleClub('taylormade-spider-tour','putter','TaylorMade','Spider Tour',155,'#aeb5c0','#484c52'),
 singleClub('ping-anser','putter','PING','Anser',135,'#c4cdcf','#343e4c',true),
 singleClub('prestige-classic-blade','putter','Odyssey','White Hot OG #1',125,'#b9bdc2','#293733',true),
 singleClub('prestige-forged-blade','putter','Bettinardi','Studio Stock 14',195,'#dedbd0','#605032',true)
);


brandedGear.push(
 singleClub("shop-callaway-strata-plus-complete-set","clubs","Callaway","Strata Plus Complete Set",180,"#bdc5ca","#343e4c",false),
 singleClub("shop-callaway-edge-complete-set","clubs","Callaway","Edge Complete Set",191,"#aab6c2","#25484a",false),
 singleClub("shop-taylormade-rbz-speedlite-complete-set","clubs","TaylorMade","RBZ SpeedLite Complete Set",202,"#d2cec5","#4c3740",false),
 singleClub("shop-cobra-fly-xl-complete-set","clubs","Cobra","FLY-XL Complete Set",213,"#bdc5ca","#343e4c",false),
 singleClub("shop-tour-edge-bazooka-370-complete-set","clubs","Tour Edge","Bazooka 370 Complete Set",224,"#aab6c2","#25484a",false),
 singleClub("shop-tour-edge-te-300-complete-set","clubs","Tour Edge","TE-300 Complete Set",235,"#d2cec5","#4c3740",false),
 singleClub("shop-wilson-ultra-complete-set","clubs","Wilson","Ultra Complete Set",246,"#bdc5ca","#343e4c",false)
);


brandedGear.push(
 singleClub("shop-callaway-paradym-ai-smoke-hl-irons","irons","Callaway","Paradym Ai Smoke HL Irons",130,"#bdc5ca","#343e4c",false),
 singleClub("shop-callaway-apex-pro-irons","irons","Callaway","Apex Pro Irons",141,"#aab6c2","#25484a",false),
 singleClub("shop-callaway-apex-cb-irons","irons","Callaway","Apex CB Irons",152,"#d2cec5","#4c3740",false),
 singleClub("shop-wilson-staff-model-blade-irons","irons","Wilson","Staff Model Blade Irons",163,"#bdc5ca","#343e4c",false),
 singleClub("shop-wilson-dynapwr-forged-irons","irons","Wilson","DYNAPWR Forged Irons",174,"#aab6c2","#25484a",false),
 singleClub("shop-wilson-dynapwr-max-irons","irons","Wilson","DYNAPWR Max Irons",185,"#d2cec5","#4c3740",false),
 singleClub("shop-titleist-t200-irons","irons","Titleist","T200 Irons",196,"#bdc5ca","#343e4c",false),
 singleClub("shop-titleist-t350-irons","irons","Titleist","T350 Irons",207,"#aab6c2","#25484a",false),
 singleClub("shop-titleist-620-mb-irons","irons","Titleist","620 MB Irons",218,"#d2cec5","#4c3740",false),
 singleClub("shop-titleist-620-cb-irons","irons","Titleist","620 CB Irons",229,"#bdc5ca","#343e4c",false),
 singleClub("shop-taylormade-qi-hl-irons","irons","TaylorMade","Qi HL Irons",240,"#aab6c2","#25484a",false),
 singleClub("shop-taylormade-p-7mc-irons","irons","TaylorMade","P·7MC Irons",131,"#d2cec5","#4c3740",false),
 singleClub("shop-taylormade-p-7cb-irons","irons","TaylorMade","P·7CB Irons",142,"#bdc5ca","#343e4c",false),
 singleClub("shop-taylormade-p-7mb-irons","irons","TaylorMade","P·7MB Irons",153,"#aab6c2","#25484a",false),
 singleClub("shop-ping-g430-irons","irons","PING","G430 Irons",164,"#d2cec5","#4c3740",false),
 singleClub("shop-ping-i230-irons","irons","PING","i230 Irons",175,"#bdc5ca","#343e4c",false),
 singleClub("shop-ping-blueprint-t-irons","irons","PING","Blueprint T Irons",186,"#aab6c2","#25484a",false),
 singleClub("shop-mizuno-jpx-925-forged-irons","irons","Mizuno","JPX 925 Forged Irons",197,"#d2cec5","#4c3740",false),
 singleClub("shop-mizuno-mizuno-pro-243-irons","irons","Mizuno","Mizuno Pro 243 Irons",208,"#bdc5ca","#343e4c",false),
 singleClub("shop-srixon-zxi4-irons","irons","Srixon","ZXi4 Irons",219,"#aab6c2","#25484a",false),
 singleClub("shop-srixon-zxi7-irons","irons","Srixon","ZXi7 Irons",230,"#d2cec5","#4c3740",false),
 singleClub("shop-cleveland-golf-launcher-xl-halo-irons","irons","Cleveland Golf","Launcher XL Halo Irons",241,"#bdc5ca","#343e4c",false)
);


brandedGear.push(
 singleClub("shop-callaway-paradym-ai-smoke-max-driver","driver","Callaway","Paradym Ai Smoke Max Driver",165,"#bdc5ca","#343e4c",false),
 singleClub("shop-callaway-paradym-ai-smoke-triple-diamond-driver","driver","Callaway","Paradym Ai Smoke Triple Diamond Driver",176,"#aab6c2","#25484a",false),
 singleClub("shop-titleist-gt3-driver","driver","Titleist","GT3 Driver",187,"#d2cec5","#4c3740",false),
 singleClub("shop-titleist-gt4-driver","driver","Titleist","GT4 Driver",198,"#bdc5ca","#343e4c",false),
 singleClub("shop-taylormade-qi10-driver","driver","TaylorMade","Qi10 Driver",209,"#aab6c2","#25484a",false),
 singleClub("shop-taylormade-qi35-max-driver","driver","TaylorMade","Qi35 Max Driver",220,"#d2cec5","#4c3740",false),
 singleClub("shop-taylormade-stealth-2-plus-driver","driver","TaylorMade","Stealth 2 Plus Driver",231,"#bdc5ca","#343e4c",false),
 singleClub("shop-ping-g430-lst-driver","driver","PING","G430 LST Driver",242,"#aab6c2","#25484a",false),
 singleClub("shop-wilson-dynapwr-carbon-driver","driver","Wilson","DYNAPWR Carbon Driver",253,"#d2cec5","#4c3740",false),
 singleClub("shop-wilson-dynapwr-max-driver","driver","Wilson","DYNAPWR Max Driver",264,"#bdc5ca","#343e4c",false),
 singleClub("shop-cobra-ds-adapt-ls-driver","driver","Cobra","DS-ADAPT LS Driver",275,"#aab6c2","#25484a",false),
 singleClub("shop-srixon-zxi-driver","driver","Srixon","ZXi Driver",166,"#d2cec5","#4c3740",false)
);


brandedGear.push(
 singleClub("shop-callaway-paradym-ai-smoke-max-fairway","wood","Callaway","Paradym Ai Smoke Max Fairway",105,"#bdc5ca","#343e4c",false),
 singleClub("shop-callaway-elyte-triple-diamond-fairway","wood","Callaway","Elyte Triple Diamond Fairway",116,"#aab6c2","#25484a",false),
 singleClub("shop-titleist-gt3-fairway","wood","Titleist","GT3 Fairway",127,"#d2cec5","#4c3740",false),
 singleClub("shop-taylormade-qi10-fairway","wood","TaylorMade","Qi10 Fairway",138,"#bdc5ca","#343e4c",false),
 singleClub("shop-taylormade-qi35-max-fairway","wood","TaylorMade","Qi35 Max Fairway",149,"#aab6c2","#25484a",false),
 singleClub("shop-ping-g430-max-fairway","wood","PING","G430 MAX Fairway",160,"#d2cec5","#4c3740",false),
 singleClub("shop-cobra-ds-adapt-max-fairway","wood","Cobra","DS-ADAPT MAX Fairway",171,"#bdc5ca","#343e4c",false),
 singleClub("shop-wilson-dynapwr-fairway","wood","Wilson","DYNAPWR Fairway",182,"#aab6c2","#25484a",false)
);


brandedGear.push(
 singleClub("shop-callaway-paradym-ai-smoke-hybrid","hybrid","Callaway","Paradym Ai Smoke Hybrid",90,"#bdc5ca","#343e4c",false),
 singleClub("shop-titleist-gt1-hybrid","hybrid","Titleist","GT1 Hybrid",101,"#aab6c2","#25484a",false),
 singleClub("shop-titleist-gt3-hybrid","hybrid","Titleist","GT3 Hybrid",112,"#d2cec5","#4c3740",false),
 singleClub("shop-taylormade-qi10-rescue","hybrid","TaylorMade","Qi10 Rescue",123,"#bdc5ca","#343e4c",false),
 singleClub("shop-ping-g430-hybrid","hybrid","PING","G430 Hybrid",134,"#aab6c2","#25484a",false),
 singleClub("shop-cobra-ds-adapt-hybrid","hybrid","Cobra","DS-ADAPT Hybrid",145,"#d2cec5","#4c3740",false),
 singleClub("shop-wilson-dynapwr-hybrid","hybrid","Wilson","DYNAPWR Hybrid",156,"#bdc5ca","#343e4c",false),
 singleClub("shop-mizuno-st-z-230-hybrid","hybrid","Mizuno","ST-Z 230 Hybrid",167,"#aab6c2","#25484a",false)
);


brandedGear.push(
 singleClub("shop-titleist-vokey-sm9-tour-chrome","wedges","Titleist","Vokey SM9 Tour Chrome",85,"#bdc5ca","#343e4c",false),
 singleClub("shop-titleist-vokey-sm10-jet-black","wedges","Titleist","Vokey SM10 Jet Black",96,"#aab6c2","#25484a",false),
 singleClub("shop-callaway-jaws-raw","wedges","Callaway","Jaws Raw",107,"#d2cec5","#4c3740",false),
 singleClub("shop-callaway-opus-platinum","wedges","Callaway","Opus Platinum",118,"#bdc5ca","#343e4c",false),
 singleClub("shop-taylormade-hi-toe-4","wedges","TaylorMade","Hi-Toe 4",129,"#aab6c2","#25484a",false),
 singleClub("shop-cleveland-golf-rtx-6-zipcore","wedges","Cleveland Golf","RTX 6 ZipCore",140,"#d2cec5","#4c3740",false),
 singleClub("shop-cleveland-golf-cbx-4-zipcore","wedges","Cleveland Golf","CBX 4 ZipCore",151,"#bdc5ca","#343e4c",false),
 singleClub("shop-cleveland-golf-smart-sole-full-face","wedges","Cleveland Golf","Smart Sole Full-Face",162,"#aab6c2","#25484a",false),
 singleClub("shop-mizuno-t24-denim-copper","wedges","Mizuno","T24 Denim Copper",173,"#d2cec5","#4c3740",false),
 singleClub("shop-ping-glide-4-0","wedges","PING","Glide 4.0",184,"#bdc5ca","#343e4c",false)
);


brandedGear.push(
 singleClub("shop-odyssey-ai-one-double-wide","putter","Odyssey","Ai-ONE Double Wide",105,"#bdc5ca","#343e4c",true),
 singleClub("shop-odyssey-ai-one-jailbird-mini","putter","Odyssey","Ai-ONE Jailbird Mini",116,"#aab6c2","#25484a",false),
 singleClub("shop-scotty-cameron-super-select-newport","putter","Scotty Cameron","Super Select Newport",127,"#d2cec5","#4c3740",true),
 singleClub("shop-scotty-cameron-phantom-5","putter","Scotty Cameron","Phantom 5",138,"#bdc5ca","#343e4c",false),
 singleClub("shop-taylormade-spider-gt","putter","TaylorMade","Spider GT",149,"#aab6c2","#25484a",false),
 singleClub("shop-taylormade-tp-reserve-b11","putter","TaylorMade","TP Reserve B11",160,"#d2cec5","#4c3740",true),
 singleClub("shop-ping-pld-milled-anser","putter","PING","PLD Milled Anser",171,"#bdc5ca","#343e4c",true),
 singleClub("shop-ping-ds72","putter","PING","DS72",182,"#aab6c2","#25484a",false),
 singleClub("shop-bettinardi-queen-b-6","putter","Bettinardi","Queen B 6",193,"#d2cec5","#4c3740",true),
 singleClub("shop-bettinardi-inovai-6-0","putter","Bettinardi","Inovai 6.0",204,"#bdc5ca","#343e4c",false),
 singleClub("shop-cleveland-golf-hb-soft-2-model-1","putter","Cleveland Golf","HB SOFT 2 Model 1",215,"#aab6c2","#25484a",true),
 singleClub("shop-l-a-b-golf-df3","putter","L.A.B. Golf","DF3",106,"#d2cec5","#4c3740",false),
 singleClub("shop-l-a-b-golf-link-1","putter","L.A.B. Golf","LINK.1",117,"#bdc5ca","#343e4c",true)
);


brandedGear.push(
 polo("nike-victory-sky", "Nike", "Dri-FIT Victory · Sky Blue", 45, "#75aecb"),
 polo("nike-tour-plum", "Nike", "Dri-FIT Tour · Plum", 85, "#78426b", "dot"),
 polo("adidas-365-sand", "adidas", "Ultimate365 · Sand Stripe", 65, "#bc9e72", "pinstripe"),
 polo("ua-playoff-forest", "Under Armour", "Playoff 3.0 · Forest Check", 65, "#355b47", "windowpane"),
 polo("fj-lisle-coral", "FootJoy", "ProDry Lisle · Coral", 90, "#d57868", "twin"),
 polo("puma-cloudspun-lilac", "PUMA", "CLOUDSPUN · Lilac", 60, "#ab97ce"),
 polo("tm-zinna-lake", "TravisMathew", "The Zinna · Lake Blue", 110, "#547889", "pinstripe"),
 polo("pm-coastline-mint", "Peter Millar", "Coastline Performance Jersey · Mint", 145, "#90bda8", "wave"),
 polo("callaway-optidri-yellow", "Callaway", "Opti-Dri Solid · Butter Yellow", 55, "#d9c66a"),
 polo("rl-airflow-navy", "RLX Ralph Lauren", "Airflow Jersey · Navy", 125, "#273957", "dot"),
 hat("titleist-tour-rope-forest", "Titleist", "Tour Rope · Forest", 65, "#244936"),
 hat("titleist-tour-performance-stone", "Titleist", "Tour Performance · Stone", 55, "#b6aea0"),
 hat("callaway-performance-pro-coral", "Callaway", "Performance Pro · Coral", 55, "#bc6658"),
 hat("taylormade-tour-radar-ice", "TaylorMade", "Tour Radar · Ice Blue", 55, "#93b6d1"),
 hat("ping-tour-classic-black", "PING", "Tour Classic · Black", 60, "#171d22"),
 hat("nike-club-lilac", "Nike", "Dri-FIT Club · Lilac", 45, "#9e8cb6"),
 hat("adidas-tour-snapback-navy", "adidas", "Tour Snapback · Navy", 50, "#24375d"),
 hat("puma-p-mint", "PUMA", "P Cap · Mint", 55, "#85b7a4"),
 bag("titleist-players4-burgundy", "Titleist", "Players 4 Stand Bag · Burgundy", 90, "#6f293b", "#dfc4aa"),
 bag("titleist-cart14-forest", "Titleist", "Cart 14 · Forest", 115, "#254938", "#aea58c", false),
 bag("callaway-fairway-c-blue", "Callaway", "Fairway C Stand Bag · Sky Blue", 95, "#638cae", "#e2e4e1"),
 bag("callaway-org14-blackgold", "Callaway", "ORG 14 Cart Bag · Black and Gold", 145, "#24282d", "#c4a35b", false),
 bag("taylormade-flextech-sand", "TaylorMade", "FlexTech Crossover · Sand", 120, "#b39a7a", "#393b42"),
 bag("ping-hoofer-lite-plum", "PING", "Hoofer Lite Stand Bag · Plum", 115, "#605070", "#d8cbe0"),
 bag("sun-mountain-45-navy", "Sun Mountain", "4.5 LS Stand Bag · Navy", 140, "#293c5b", "#a5bed0"),
 bag("vessel-player-v-sage", "VESSEL", "Player V Stand Bag · Sage", 195, "#7a8e77", "#e3d4b4")
);

brandedGear.push(
 bag('nike-sport-lite-black','Nike','Sport Lite Stand Bag · Black',95,'#20242b','#e9edf1'),
 bag('nike-sport-lite-blue','Nike','Sport Lite Stand Bag · Blue',95,'#28518a','#e4ebf5'),
 bag('nike-air-hybrid-navy','Nike','Air Hybrid Stand Bag · Navy',130,'#233753','#b9c6d3'),
 bag('nike-performance-cart-red','Nike','Performance Cart Bag · Black and Red',140,'#22252b','#b62e3c',false),
 hat('nike-club-white','Nike','Dri-FIT Club · White',45,'#f0eee7'),
 hat('nike-club-forest','Nike','Dri-FIT Club · Forest',45,'#294e39'),
 hat('nike-ace-black','Nike','Dri-FIT Ace · Black',60,'#202329'),
 hat('nike-ace-sand','Nike','Dri-FIT Ace · Sand',60,'#bba583'),
 hat('nike-ace-red','Nike','Dri-FIT Ace · Red',60,'#a92739')
);

brandedGear.push(
 singleClub('scotty-super-select-newport2-plus','putter','Scotty Cameron','Super Select Newport 2 Plus',190,'#c4cace','#34414a',true),
 singleClub('odyssey-aione-rossie','putter','Odyssey','Ai-ONE Rossie S',150,'#9ab3cc','#26364e')
);
