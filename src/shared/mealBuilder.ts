import type { AssessmentRecord } from './types.js';

export type FoodBandTone = 'green' | 'forest' | 'red' | 'blue' | 'slate';

export interface MealFormulaLine {
  label: string;
  gramsLabel: string;
  measureHint: string;
}

export interface FoodClassBand {
  tone: FoodBandTone;
  title: string;
  itemsText: string;
}

export interface SubstituteRow {
  name: string;
  grams: string;
  measureHint?: string;
}

export interface SubstituteSection {
  title: string;
  rows: SubstituteRow[];
  notes: string[];
}

export interface RichMealSheet {
  id: string;
  orderLabel: string;
  title: string;
  suggestedWindow: string;
  estimatedKcal: number;
  estimatedProteinG: number;
  formula: MealFormulaLine[];
  howToBuild: string;
  bands: FoodClassBand[];
  substituteTables: SubstituteSection[];
}

export interface CompleteSubstitutionCatalogGroup {
  title: string;
  subtitle: string;
  tone: FoodBandTone;
  items: string[];
}

function roundTo5(value: number, min = 10): number {
  return Math.max(min, Math.round(value / 5) * 5);
}

function normalizeText(value: string | undefined): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getAllergenFlags(evaluation: AssessmentRecord) {
  const raw = normalizeText(
    `${evaluation.input.allergies || ''} ${evaluation.input.avoidFoods || ''}`
  );
  const diet = evaluation.input.dietaryPreference || 'onivoro';
  const isVegan = diet === 'vegano';
  const isVegetarian = diet === 'vegetariano' || isVegan;
  const noLactose = isVegan || raw.includes('leite') || raw.includes('lactose') || raw.includes('laticin');
  const noEggs = isVegan || raw.includes('ovo');
  const noGluten = raw.includes('gluten') || raw.includes('trigo') || raw.includes('celiac');
  const noPeanuts = raw.includes('amendoim');
  const noNuts = raw.includes('castanha') || raw.includes('nozes') || raw.includes('oleagin');
  const noFish = isVegetarian || raw.includes('peixe') || raw.includes('atum') || raw.includes('sardinha');
  const noPork = isVegetarian || raw.includes('porco') || raw.includes('suin');
  const noFridge = !evaluation.input.hasFridge;
  const budget = evaluation.input.budgetPriority;

  return {
    isVegan,
    isVegetarian,
    noLactose,
    noEggs,
    noGluten,
    noPeanuts,
    noNuts,
    noFish,
    noPork,
    noFridge,
    budget
  };
}

export function buildRichMealSheets(evaluation: AssessmentRecord): RichMealSheet[] {
  const prescription = evaluation.engineResult.prescription;
  if (!prescription) return [];

  const flags = getAllergenFlags(evaluation);
  const targetKcal = prescription.targetKcal || 1800;
  const totalProtein = prescription.macros.proteinG || 120;
  const totalCarbs = prescription.macros.carbsG || 180;
  const totalFat = prescription.macros.fatG || 52;
  const mealCount =
    prescription.meals && prescription.meals.length > 0
      ? prescription.meals.length
      : evaluation.input.preferredMealCount || 4;

  // Fator de escala relativo a um plano padrão de 1800 kcal
  const kcalScale = Math.max(0.75, Math.min(1.55, targetKcal / 1800));
  const protScale = Math.max(0.75, Math.min(1.6, totalProtein / 120));
  const carbScale = Math.max(0.7, Math.min(1.6, totalCarbs / 180));
  const fatScale = Math.max(0.75, Math.min(1.5, totalFat / 55));

  // Listas ricas de alimentos por classe (filtradas por alergias/preferências)
  const fruitsClass1List =
    'Acerola, Laranja, Tangerina (mexerica), Maracujá, Melão, Melancia, Morango, Kiwi, Caju, Goiaba, Mamão papaia, Abacaxi, Pera, Maçã, Pêssego, Ameixa fresca, Pitaya e Carambola.';

  const leafyGreensList =
    'Alface (crespa, americana, lisa ou roxa), Rúcula, Agrião, Espinafre, Couve-manteiga, Acelga, Repolho (verde ou roxo), Almeirão, Chicória, Escarola, Folha de mostarda, Hortelã e Cheiro-verde.';

  const veggiesClass1List =
    'Tomate, Pepino, Abobrinha, Chuchu, Berinjela, Brócolis, Couve-flor, Vagem, Quiabo, Jiló, Pimentão colorido, Rabanete, Palmito, Aspargos, Abóbora cabotiá, Cenoura e Beterraba.';

  const carbsClass3BreakfastList = flags.noGluten
    ? 'Tapioca (goma hidratada), Cuscuz de milho cozido, Aveia sem glúten, Banana (prata ou nanica), Pão sem glúten, Biscoito de arroz e Pipoca feita sem manteiga.'
    : 'Pães (francês, forma integral, sírio ou pita — respeitando o peso), Aveia em flocos, Tapioca (goma hidratada), Banana (prata ou nanica), Cuscuz de milho e Pipoca feita com pouco óleo.';

  const carbsClass2MainList = flags.noGluten
    ? 'Arroz (branco, parboilizado ou integral), Feijão (carioca, preto, fradinho ou branco), Lentilha, Grão-de-bico, Ervilha, Batata inglesa, Batata-doce, Mandioquinha (baroa), Mandioca/Aipim, Inhame, Cará, Cuscuz de milho, Quinoa e Milho verde.'
    : 'Arroz (branco, parboilizado ou integral), Feijão (carioca, preto, fradinho ou branco), Lentilha, Grão-de-bico, Ervilha, Batata inglesa, Batata-doce, Mandioquinha (baroa), Mandioca/Aipim, Inhame, Cará, Macarrão cozido, Cuscuz de milho, Quinoa e Milho verde.';

  // Pesos das refeições conforme quantidade de refeições (3, 4, 5 ou 6)
  const splitWeights: Record<number, { breakfast: number; morning?: number; lunch: number; afternoon?: number; dinner: number; supper?: number }> = {
    3: { breakfast: 0.28, lunch: 0.39, dinner: 0.33 },
    4: { breakfast: 0.24, lunch: 0.34, afternoon: 0.14, dinner: 0.28 },
    5: { breakfast: 0.21, morning: 0.1, lunch: 0.31, afternoon: 0.13, dinner: 0.25 },
    6: { breakfast: 0.19, morning: 0.09, lunch: 0.29, afternoon: 0.12, dinner: 0.23, supper: 0.08 }
  };
  const weights = splitWeights[mealCount] || splitWeights[4];

  // ========= 1. CAFÉ DA MANHÃ =========
  const bfFruitG = roundTo5(180 * carbScale, 120);
  const bfCarb3G = roundTo5(55 * carbScale, 35);
  const bfProtBaseG = roundTo5(135 * protScale, 90); // ~3 ovos inteiros ou claras
  const bfFatG = roundTo5(35 * fatScale, 20);
  const bfWheyG = roundTo5(25 * protScale, 20);
  const bfYogurtG = roundTo5(190 * protScale, 150);
  const bfTunaOrTurkeyG = roundTo5(65 * protScale, 50);
  const bfCheeseG = roundTo5(85 * protScale, 60);
  const bfTofuG = roundTo5(120 * protScale, 90);
  const bfNutsG = roundTo5(20 * fatScale, 15);
  const bfAvocadoG = roundTo5(80 * fatScale, 60);
  const bfFlaxG = roundTo5(20 * fatScale, 15);
  const bfPeanutButterG = roundTo5(18 * fatScale, 15);

  const breakfastProtBase = flags.noEggs
    ? flags.noLactose
      ? 'Tofu firme mexido com cúrcuma ou proteína vegetal (preparar em frigideira antiaderente com fio mínimo de azeite).'
      : 'Iogurte natural/proteico ou queijo cottage/ricota fresca.'
    : 'Ovos inteiros ou claras de ovo (cozidos, pochê ou mexidos na frigideira apenas com um fio mínimo de óleo ou azeite — pequena dose não compromete o resultado).';

  const breakfastProtRows: SubstituteRow[] = [
    ...(!flags.noLactose
      ? [
          { name: 'Whey Protein (concentrado ou isolado)', grams: `${bfWheyG} g`, measureHint: '~1 scoop' },
          { name: 'Iogurte Proteico ou Natural Desnatado', grams: `${bfYogurtG} g`, measureHint: '1 pote grande' },
          { name: 'Queijo Cottage, Ricota ou Minas Frescal', grams: `${bfCheeseG} g`, measureHint: '2 fatias médias' }
        ]
      : [
          { name: 'Proteína Vegetal em pó (ervilha/arroz)', grams: `${bfWheyG} g`, measureHint: '~1 scoop' }
        ]),
    ...(!flags.isVegetarian && !flags.noFish
      ? [{ name: 'Atum em água (drenado) ou Frango desfiado', grams: `${bfTunaOrTurkeyG} g`, measureHint: '3 col. sopa' }]
      : []),
    ...(!flags.isVegetarian
      ? [{ name: 'Peito de peru ou Frango desfiado cozido', grams: `${bfTunaOrTurkeyG} g`, measureHint: '3 fatias / col.' }]
      : []),
    { name: 'Tofu firme grelhado ou mexido', grams: `${bfTofuG} g`, measureHint: '2 fatias grossas' }
  ];

  const breakfastFatRows: SubstituteRow[] = [
    ...(!flags.noNuts
      ? [{ name: 'Castanhas (pará, caju, nozes ou amêndoas)', grams: `${bfNutsG} g`, measureHint: '~4 a 6 unidades' }]
      : []),
    { name: 'Abacate fresco', grams: `${bfAvocadoG} g`, measureHint: '3 col. sopa cheias' },
    { name: 'Semente de Linhaça ou Chia', grams: `${bfFlaxG} g`, measureHint: '1,5 col. sopa' },
    ...(!flags.noPeanuts
      ? [{ name: 'Pasta de amendoim integral (sem açúcar)', grams: `${bfPeanutButterG} g`, measureHint: '1 col. sopa rasa' }]
      : [])
  ];

  const breakfastSheet: RichMealSheet = {
    id: 'breakfast',
    orderLabel: 'Refeição 01',
    title: 'Café da Manhã',
    suggestedWindow: evaluation.input.shiftWorker
      ? 'Até 1h após acordar'
      : `Por volta das ${evaluation.input.wakeTime || '07:00'}`,
    estimatedKcal: Math.round(targetKcal * weights.breakfast),
    estimatedProteinG: Math.round(totalProtein * weights.breakfast),
    formula: [
      {
        label: 'Escolha 1 opção ou faça um mix de Carboidrato Classe 1 (Frutas)',
        gramsLabel: `${bfFruitG} g`,
        measureHint: '~1,5 xícara picada ou 2 frutas pequenas'
      },
      {
        label: 'Escolha 1 opção ou faça um mix de Carboidrato Classe 3 (Base)',
        gramsLabel: `${bfCarb3G} g`,
        measureHint: 'ex.: 1 pão francês ou 3 col. sopa aveia/tapioca'
      },
      {
        label: 'Escolha sua Fonte de Proteína',
        gramsLabel: flags.noEggs ? `${bfTofuG} g` : `${bfProtBaseG} g`,
        measureHint: flags.noEggs ? 'ou substituto da tabela abaixo' : '~2 a 3 ovos médios ou substituto abaixo'
      },
      {
        label: 'Escolha sua Fonte de Gordura Boa',
        gramsLabel: flags.noEggs ? `${bfNutsG} g` : `${bfFatG} g`,
        measureHint: flags.noEggs ? 'castanhas, abacate ou linhaça' : 'própria gema dos ovos ou substituto abaixo'
      }
    ],
    howToBuild:
      'Monte seu café combinando pelo menos 1 fruta variada (Classe 1) + 1 carboidrato prático (Classe 3) + sua proteína + gordura boa. Você pode misturar frutas diferentes todos os dias respeitando a soma total em gramas.',
    bands: [
      {
        tone: 'green',
        title: 'Carboidratos Classe 1 (Frutas Leves & Alto Volume)',
        itemsText: fruitsClass1List
      },
      {
        tone: 'red',
        title: 'Carboidratos Classe 3 (Energia do Café da Manhã)',
        itemsText: carbsClass3BreakfastList
      },
      {
        tone: 'blue',
        title: 'Fonte de Proteína Principal',
        itemsText: breakfastProtBase
      },
      {
        tone: 'slate',
        title: 'Fonte de Gordura Boa',
        itemsText: flags.noEggs
          ? 'Azeite extravirgem (1 col. chá) ou qualquer opção equivalente da tabela de gorduras abaixo.'
          : 'A própria gema dos ovos inteiros (ou, se usar apenas claras/whey, escolha uma opção da tabela de gorduras abaixo).'
      }
    ],
    substituteTables: [
      {
        title: flags.noEggs ? 'Substitutos para a Proteína Principal' : 'Substitutos para os Ovos / Claras',
        rows: breakfastProtRows,
        notes: [
          'Quando trocar os ovos por Iogurte Proteico ou Queijo Minas/Cottage, reduza a fonte extra de gordura dessa refeição.',
          'Pode dividir a proteína (ex.: metade ovo + metade queijo ou whey com fruta) usando metade do peso de cada opção.'
        ]
      },
      {
        title: 'Substitutos para a Gordura Boa (Gema)',
        rows: breakfastFatRows,
        notes: [
          'Ao escolher Abacate, reduza metade do Carboidrato Classe 1 (frutas), pois ele combina energia e gordura boa.',
          'Ao incluir Linhaça, Chia ou Pasta de Amendoim, dispense azeite ou manteiga extra no preparo.'
        ]
      }
    ]
  };

  // ========= 2. LANCHE DA MANHÃ (se 5 ou 6 refeições) =========
  const msFruitG = roundTo5(160 * carbScale, 110);
  const msProtRows: SubstituteRow[] = [
    ...(!flags.noLactose && !flags.noFridge
      ? [{ name: 'Iogurte Natural Desnatado ou Proteico', grams: `${roundTo5(150 * protScale, 120)} g`, measureHint: '1 pote' }]
      : []),
    ...(!flags.noLactose
      ? [{ name: 'Whey Protein batido com água', grams: `${roundTo5(20 * protScale, 15)} g`, measureHint: '3/4 scoop' }]
      : [{ name: 'Proteína Vegetal com água', grams: `${roundTo5(20 * protScale, 15)} g`, measureHint: '3/4 scoop' }]),
    ...(!flags.noEggs ? [{ name: 'Ovos cozidos', grams: '90 g', measureHint: '2 unidades médias' }] : []),
    ...(!flags.noNuts ? [{ name: 'Mix de Castanhas ou Amêndoas (sem sal)', grams: `${roundTo5(15 * fatScale, 15)} g`, measureHint: '1 punhado pequeno' }] : [])
  ];

  const morningSnackSheet: RichMealSheet = {
    id: 'morning_snack',
    orderLabel: 'Refeição 02',
    title: 'Lanche da Manhã (Colação)',
    suggestedWindow: evaluation.input.shiftWorker ? '2h30 a 3h após o café' : 'Entre 09:30 e 10:30',
    estimatedKcal: Math.round(targetKcal * (weights.morning || 0.1)),
    estimatedProteinG: Math.round(totalProtein * (weights.morning || 0.1)),
    formula: [
      {
        label: 'Escolha 1 ou faça um mix de Frutas Classe 1 (variar do café!)',
        gramsLabel: `${msFruitG} g`,
        measureHint: '1 fruta média ou 1 potinho de frutas picadas'
      },
      {
        label: 'Adicione 1 opção leve de Saciedade (Proteína ou Fibra/Gordura boa)',
        gramsLabel: flags.noFridge ? '20 g' : '120 a 150 g',
        measureHint: flags.noFridge ? 'castanhas, aveia ou chia (fora da geladeira)' : 'iogurte, whey ou 2 ovos cozidos'
      }
    ],
    howToBuild:
      'Pausa curta e refrescante para não chegar com fome exagerada no almoço. Priorize frutas diferentes das que você comeu no café da manhã para ampliar vitaminas e fibras.',
    bands: [
      {
        tone: 'green',
        title: 'Frutas Classe 1 (Sugestões de Rotação Diária)',
        itemsText: fruitsClass1List
      },
      {
        tone: 'blue',
        title: 'Complemento de Saciedade Prático',
        itemsText: flags.noFridge
          ? 'Opções seguras fora da geladeira: Castanhas sem sal, Aveia em flocos, Chia/Linhaça, Dose de proteína em pó ou Grão-de-bico torrado.'
          : 'Iogurte natural/proteico, Ovos cozidos, Queijo branco ou Dose de proteína (Whey/Vegetal).'
      }
    ],
    substituteTables: [
      {
        title: 'Opções de Substituição para a Saciedade',
        rows: msProtRows,
        notes: [
          'Se estiver sem fome neste horário, você pode transferir essa fruta para a sobremesa do almoço sem prejuízo.',
          'Beba 1 copo de 250 ml de água junto ou logo antes do lanche.'
        ]
      }
    ]
  };

  // ========= 3. ALMOÇO (ALTO VOLUME DE FOLHAS + VERDURAS + MIX CLASSE 2 + PROTEÍNA) =========
  const lunchVeggiesG = roundTo5(220 * kcalScale, 180);
  const lunchCarb2G = roundTo5(180 * carbScale, 120); // Ex: 100g arroz + 80g feijão
  const lunchProtG = roundTo5(135 * protScale, 100); // peso cozido/grelhado
  const lunchFruitG = roundTo5(120 * carbScale, 90);
  const lunchOilG = Math.max(5, Math.round(8 * fatScale));

  const lunchProtRows: SubstituteRow[] = [
    ...(!flags.isVegetarian
      ? [
          { name: 'Peito de Frango grelhado/desfiado (cozido)', grams: `${lunchProtG} g`, measureHint: '1 filé grande' },
          { name: 'Carne bovina magra (patinho, coxão mole, músculo)', grams: `${roundTo5(lunchProtG * 0.95, 95)} g`, measureHint: '1 bife médio' },
          ...(!flags.noFish
            ? [
                { name: 'Peixe magro (tilápia, merluza, pescada, linguado)', grams: `${roundTo5(lunchProtG * 1.15, 110)} g`, measureHint: '1 posta/filé grande' },
                { name: 'Atum em água ou Sardinha drenada', grams: `${roundTo5(lunchProtG * 0.9, 85)} g`, measureHint: '1 lata drenada' }
              ]
            : []),
          ...(!flags.noPork
            ? [{ name: 'Lombo suíno ou Filé mignon suíno assado', grams: `${roundTo5(lunchProtG * 0.95, 95)} g`, measureHint: '2 medalhões' }]
            : [])
        ]
      : []),
    ...(!flags.noEggs
      ? [{ name: 'Ovos inteiros (cozidos, pochê ou omelete)', grams: `${roundTo5(lunchProtG * 1.25, 135)} g`, measureHint: '3 ovos médios' }]
      : []),
    { name: 'Tofu firme grelhado ou Proteína de Soja hidratada', grams: `${roundTo5(lunchProtG * 1.35, 140)} g`, measureHint: '5 col. sopa cheias' }
  ];

  const lunchFatRows: SubstituteRow[] = [
    { name: 'Azeite de oliva extravirgem (na salada)', grams: `${lunchOilG} g`, measureHint: '1 col. sopa rasa' },
    { name: 'Abacate em cubos na salada', grams: `${roundTo5(lunchOilG * 6.5, 45)} g`, measureHint: '2 col. sopa cheias' },
    ...(!flags.noNuts
      ? [{ name: 'Castanhas ou Sementes (abóbora/girassol/gergelim)', grams: `${roundTo5(lunchOilG * 1.8, 12)} g`, measureHint: '1 col. sopa' }]
      : []),
    { name: 'Azeitonas verdes ou pretas', grams: `${roundTo5(lunchOilG * 5, 35)} g`, measureHint: '~6 a 8 unidades' }
  ];

  const lunchSheet: RichMealSheet = {
    id: 'lunch',
    orderLabel: mealCount >= 5 ? 'Refeição 03' : 'Refeição 02',
    title: 'Almoço (Alto Volume, Saciedade e Comida de Verdade)',
    suggestedWindow: evaluation.input.shiftWorker ? '4h a 5h após acordar' : 'Entre 12:00 e 13:30',
    estimatedKcal: Math.round(targetKcal * weights.lunch),
    estimatedProteinG: Math.round(totalProtein * weights.lunch),
    formula: [
      {
        label: 'Folhas Verdes variadas (BASE LIVRE — comece sempre por elas!)',
        gramsLabel: 'Livre (mín. 100 g)',
        measureHint: '1 prato fundo cheio de folhas diversas'
      },
      {
        label: 'Escolha 2 ou mais Verduras e Legumes Classe 1 (Alto Volume)',
        gramsLabel: `${lunchVeggiesG} g`,
        measureHint: '~6 a 8 col. sopa cheias (cozidos, assados ou crus)'
      },
      {
        label: 'Escolha 1 opção ou faça um mix de Carboidrato Classe 2',
        gramsLabel: `${lunchCarb2G} g`,
        measureHint: 'ex.: 100g arroz + 80g feijão (ou batata/mandioca)'
      },
      {
        label: 'Escolha sua Fonte de Proteína Magra (peso pronto/grelhado)',
        gramsLabel: `${lunchProtG} g`,
        measureHint: '1 filé grande ou substituto da tabela abaixo'
      },
      {
        label: 'Gordura Boa no tempero + Fruta Classe 1 de sobremesa (opcional)',
        gramsLabel: `${lunchOilG} g + ${lunchFruitG} g`,
        measureHint: '1 fio de azeite + 1 fruta cítrica (ajuda absorver ferro!)'
      }
    ],
    howToBuild:
      'Metade do seu prato deve ser preenchida por folhas verdes + legumes variados (isso gera enorme volume gástrico com baixíssima caloria!). No Carboidrato Classe 2, você pode comer só 1 opção ou misturar (ex.: arroz + feijão, ou arroz + batata) desde que a soma respeite os gramas totais.',
    bands: [
      {
        tone: 'forest',
        title: 'Folhas Verdes (Consumo Livre — Mínimo 1 Prato Fundo)',
        itemsText: leafyGreensList
      },
      {
        tone: 'green',
        title: 'Verduras e Legumes Classe 1 (Alto Volume — Varie 2 a 3 Cores/Dia)',
        itemsText: veggiesClass1List
      },
      {
        tone: 'red',
        title: 'Carboidratos Classe 2 (Base de Energia — Escolha 1 ou Faça Mix)',
        itemsText: carbsClass2MainList
      },
      {
        tone: 'blue',
        title: 'Fonte de Proteína Principal (Peso Pronto para Consumo)',
        itemsText: flags.isVegetarian
          ? 'Tofu firme grelhado, proteína texturizada de soja hidratada ou ovos cozidos/omelete (combinados com feijão/lentilha/grão-de-bico).'
          : 'Peito de frango grelhado, desfiado ou assado — ou troque livremente por qualquer corte magro da tabela de substitutos abaixo.'
      },
      {
        tone: 'slate',
        title: 'Sobremesa Estratégica (Frutas Classe 1 — Vitamina C & Saciedade)',
        itemsText:
          'Laranja, Tangerina, Abacaxi, Kiwi, Morango, Melancia, Melão, Goiaba ou Acerola (frutas ricas em vitamina C melhoram a absorção de ferro e tiram a vontade de doce pós-almoço).'
      }
    ],
    substituteTables: [
      {
        title: 'Substitutos Equivalentes para a Proteína do Almoço',
        rows: lunchProtRows,
        notes: [
          'Os pesos indicados já consideram o alimento PRONTO (cozido/grelhado). Se pesar cru, adicione cerca de +25% no peso.',
          'Pode dividir 2 proteínas no mesmo prato (ex.: metade frango + 1 ovo cozido) usando metade do peso de cada.'
        ]
      },
      {
        title: 'Gordura Boa & Temperos Liberados na Salada',
        rows: lunchFatRows,
        notes: [
          'Liberados à vontade para dar sabor sem somar calorias: limão, vinagre (maçã/balsâmico), alho, cebola, orégano, páprica, cúrcuma, pimenta-do-reino, mostarda amarela (1 col. chá) e ervas frescas.',
          'Evite molhos prontos cremosos e frituras por imersão — prefira grelhado, assado, airfryer ou cozido.'
        ]
      }
    ]
  };

  // ========= 4. LANCHE DA TARDE (se 4, 5 ou 6 refeições) =========
  const afFruitG = roundTo5(180 * carbScale, 130);
  const afCarb3G = roundTo5(40 * carbScale, 25);
  const afProtG = roundTo5(150 * protScale, 110);

  const afternoonProtRows: SubstituteRow[] = [
    ...(!flags.noLactose && !flags.noFridge
      ? [
          { name: 'Iogurte Proteico ou Natural Desnatado', grams: `${afProtG} g`, measureHint: '1 pote' },
          { name: 'Queijo Cottage, Ricota ou Minas Frescal', grams: `${roundTo5(afProtG * 0.48, 55)} g`, measureHint: '2 fatias médias' }
        ]
      : []),
    ...(!flags.noLactose
      ? [{ name: 'Whey Protein (com água ou na fruta/aveia)', grams: `${roundTo5(25 * protScale, 20)} g`, measureHint: '1 scoop' }]
      : [{ name: 'Proteína Vegetal em pó (ervilha/arroz)', grams: `${roundTo5(25 * protScale, 20)} g`, measureHint: '1 scoop' }]),
    ...(!flags.noEggs ? [{ name: 'Ovos cozidos (ótimo para levar)', grams: '90 a 100 g', measureHint: '2 ovos médios' }] : []),
    ...(!flags.isVegetarian
      ? [{ name: 'Frango desfiado ou Atum drenado (sanduíche)', grams: `${roundTo5(60 * protScale, 50)} g`, measureHint: '3 col. sopa' }]
      : [])
  ];

  const afternoonSnackSheet: RichMealSheet = {
    id: 'afternoon_snack',
    orderLabel: mealCount >= 5 ? 'Refeição 04' : 'Refeição 03',
    title: flags.noFridge
      ? 'Lanche da Tarde (Prático para Levar Fora da Geladeira)'
      : 'Lanche Estratégico da Tarde (Blindagem contra Fome Noturna)',
    suggestedWindow: evaluation.input.shiftWorker
      ? '2h30 antes do pico de fome do turno'
      : 'Entre 16:00 e 17:00',
    estimatedKcal: Math.round(targetKcal * (weights.afternoon || 0.14)),
    estimatedProteinG: Math.round(totalProtein * (weights.afternoon || 0.14)),
    formula: [
      {
        label: 'Escolha 1 ou faça um mix de Frutas Classe 1 (varie das outras refeições!)',
        gramsLabel: `${afFruitG} g`,
        measureHint: '~1,5 xícara picada ou 2 frutas médias'
      },
      {
        label: 'Escolha 1 opção de Carboidrato Classe 3 (Fibra & Energia)',
        gramsLabel: `${afCarb3G} g`,
        measureHint: 'ex.: 2 a 3 col. sopa de aveia, 1 banana ou pão/tapioca'
      },
      {
        label: 'Adicione sua Fonte de Proteína Prática',
        gramsLabel: flags.noFridge ? '25 a 60 g' : `${afProtG} g`,
        measureHint: flags.noFridge ? 'whey, ovos cozidos ou atum/castanhas' : 'iogurte, whey, queijo branco ou ovos'
      }
    ],
    howToBuild:
      'Essa refeição existe para cortar a fome voraz do fim do dia. Misture uma fruta refrescante + fibra (aveia/pão/pipoca) + uma proteína prática. Assim você chega ao jantar calmo e no controle.',
    bands: [
      {
        tone: 'green',
        title: 'Frutas Classe 1 (Alto Volume e Doçura Natural)',
        itemsText: fruitsClass1List
      },
      {
        tone: 'red',
        title: 'Carboidratos Classe 3 (Lanche Prático)',
        itemsText: carbsClass3BreakfastList
      },
      {
        tone: 'blue',
        title: 'Proteína de Saciedade da Tarde',
        itemsText: flags.noFridge
          ? 'Opções seguras fora da geladeira: Dose de Whey/Proteína vegetal na coqueteleira, Ovos cozidos com casca, Atum em lata, ou Grão-de-bico assado + Castanhas.'
          : 'Iogurte natural/proteico, Whey Protein batido ou misturado na fruta, Queijo branco/cottage, Ovos cozidos ou Frango desfiado.'
      }
    ],
    substituteTables: [
      {
        title: 'Substitutos Proteicos para o Lanche da Tarde',
        rows: afternoonProtRows,
        notes: [
          'Dica contra vontade de doce: pique morango + mamão ou banana, adicione aveia, canela em pó e iogurte ou whey.',
          'Se preferir lanche salgado: pão ou tapioca (Classe 3) + frango desfiado/queijo/ovo + tomate e folhas (livres!).'
        ]
      }
    ]
  };

  // ========= 5. JANTAR (LEVE, RICO EM FOLHAS, LEGUMES E PROTEÍNA) =========
  const dinnerVeggiesG = roundTo5(220 * kcalScale, 180);
  const dinnerCarb2G = roundTo5(135 * carbScale, 90);
  const dinnerProtG = roundTo5(130 * protScale, 95);
  const dinnerOilG = Math.max(5, Math.round(7 * fatScale));

  const dinnerProtRows: SubstituteRow[] = [
    ...(!flags.isVegetarian
      ? [
          { name: 'Peito de Frango grelhado/desfiado', grams: `${dinnerProtG} g`, measureHint: '1 filé médio/grande' },
          ...(!flags.noFish
            ? [
                { name: 'Tilápia, Merluza, Pescada ou Salmão assado', grams: `${roundTo5(dinnerProtG * 1.15, 105)} g`, measureHint: '1 filé grande' },
                { name: 'Sardinha ou Atum em água (drenado)', grams: `${roundTo5(dinnerProtG * 0.9, 85)} g`, measureHint: '1 lata drenada' }
              ]
            : []),
          { name: 'Carne moída magra (patinho) ou Bife magro', grams: `${roundTo5(dinnerProtG * 0.95, 90)} g`, measureHint: '4 col. sopa cheias' }
        ]
      : []),
    ...(!flags.noEggs
      ? [{ name: 'Omelete de forno / mexido com legumes', grams: `${roundTo5(dinnerProtG * 1.25, 135)} g`, measureHint: '3 ovos médios' }]
      : []),
    { name: 'Tofu firme grelhado ou Hambúrguer de grão-de-bico/soja', grams: `${roundTo5(dinnerProtG * 1.35, 135)} g`, measureHint: '2 fatias grossas' }
  ];

  const dinnerSheet: RichMealSheet = {
    id: 'dinner',
    orderLabel: mealCount === 3 ? 'Refeição 03' : mealCount === 4 ? 'Refeição 04' : 'Refeição 05',
    title: 'Jantar Prático e Leve (Alto Volume de Vegetais)',
    suggestedWindow: evaluation.input.shiftWorker ? 'Até 2h antes de dormir' : 'Entre 19:30 e 21:00',
    estimatedKcal: Math.round(targetKcal * weights.dinner),
    estimatedProteinG: Math.round(totalProtein * weights.dinner),
    formula: [
      {
        label: 'Folhas Verdes variadas (BASE LIVRE — salada colorida ou refogada)',
        gramsLabel: 'Livre (mín. 100 g)',
        measureHint: '1 prato fundo cheio de folhas diversas'
      },
      {
        label: 'Escolha 2 ou mais Verduras e Legumes Classe 1 (assados, vapor ou sopa)',
        gramsLabel: `${dinnerVeggiesG} g`,
        measureHint: '~6 a 8 col. sopa (abobrinha, brócolis, chuchu, tomate...)'
      },
      {
        label: 'Escolha 1 opção ou faça um mix de Carboidrato Classe 2 (ou Classe 3)',
        gramsLabel: `${dinnerCarb2G} g`,
        measureHint: 'ex.: batata cozida/airfryer, arroz + feijão, mandioca ou pão/tapioca'
      },
      {
        label: 'Escolha sua Fonte de Proteína Magra (peso pronto)',
        gramsLabel: `${dinnerProtG} g`,
        measureHint: 'frango, peixe, carne magra ou 3 ovos'
      },
      {
        label: 'Fonte de Gordura Boa no tempero',
        gramsLabel: `${dinnerOilG} g`,
        measureHint: '1 col. sobremesa de azeite ou 2 col. abacate'
      }
    ],
    howToBuild:
      'Você pode jantar comida de panela (arroz/feijão ou batata + proteína + salada) OU fazer um jantar rápido de frigideira/lanche completo (omelete recheado com legumes + salada grande, ou sopa de legumes com frango desfiado). O segredo é manter alto volume de vegetais + boa proteína para dormir leve.',
    bands: [
      {
        tone: 'forest',
        title: 'Folhas Verdes (Consumo Livre — Crus ou Refogados)',
        itemsText: leafyGreensList
      },
      {
        tone: 'green',
        title: 'Verduras e Legumes Classe 1 (Refogados, Assados ou Sopa)',
        itemsText: veggiesClass1List
      },
      {
        tone: 'red',
        title: 'Carboidratos Classe 2 / Práticos para o Jantar',
        itemsText: `${carbsClass2MainList} (Se preferir lanche rápido à noite, pode trocar por ${roundTo5(dinnerCarb2G * 0.45, 45)}g de Pão ou Tapioca/Cuscuz).`
      },
      {
        tone: 'blue',
        title: 'Fonte de Proteína do Jantar (Peso Pronto)',
        itemsText: flags.isVegetarian
          ? 'Ovos (omelete/cozidos), Tofu firme grelhado ou Proteína de soja refogada com legumes.'
          : 'Frango grelhado/desfiado, Peixe assado (tilápia/merluza), Patinho moído, Atum/Sardinha ou Omelete de 3 ovos com legumes.'
      }
    ],
    substituteTables: [
      {
        title: 'Substitutos Proteicos para o Jantar',
        rows: dinnerProtRows,
        notes: [
          'Ideia prática de 10 minutos: refogue abobrinha + tomate + espinafre + frango desfiado ou 3 ovos batidos (omelete gigante de alto volume!).',
          'Em dias frios, transforme os Legumes Classe 1 + Carboidrato (batata/mandioquinha) + Frango desfiado em uma sopa cremosa nutritiva.'
        ]
      }
    ]
  };

  // ========= 6. CEIA LEVE (se 6 refeições) =========
  const supperSheet: RichMealSheet = {
    id: 'supper',
    orderLabel: 'Refeição 06',
    title: 'Ceia Leve (Rotina Noturna / Sono Reparador)',
    suggestedWindow: evaluation.input.shiftWorker ? 'Encerramento do ciclo de vigília' : 'Cerca de 1h antes de dormir',
    estimatedKcal: Math.round(targetKcal * (weights.supper || 0.08)),
    estimatedProteinG: Math.round(totalProtein * (weights.supper || 0.08)),
    formula: [
      {
        label: 'Escolha 1 Fruta Classe 1 leve (ex.: kiwi, morango, melão ou mamão)',
        gramsLabel: `${roundTo5(120 * carbScale, 90)} g`,
        measureHint: '1 porção pequena'
      },
      {
        label: 'Acompanhamento leve de Proteína / Fibra',
        gramsLabel: flags.noLactose ? '15 g' : '120 g',
        measureHint: flags.noLactose ? '1 col. sopa de chia/linhaça ou proteína vegetal' : '1 pote pequeno de iogurte natural ou 1 col. chia'
      }
    ],
    howToBuild:
      'Refeição opcional apenas para quem dorme muito tarde ou sente fome real antes de deitar. Evite grandes volumes ou frituras para não prejudicar a qualidade do sono.',
    bands: [
      {
        tone: 'green',
        title: 'Frutas Leves para a Noite (Classe 1)',
        itemsText: 'Kiwi, Morango, Mamão papaia, Melão, Pera, Maçã assada com canela ou Maracujá.'
      },
      {
        tone: 'blue',
        title: 'Complemento Leve + Chá Calmante',
        itemsText: flags.noLactose
          ? 'Chá de camomila, melissa ou mulungu (sem açúcar) + Semente de chia/linhaça ou dose leve de proteína vegetal.'
          : 'Iogurte natural desnatado ou Kefir + Chá de camomila, erva-doce ou melissa sem açúcar.'
      }
    ],
    substituteTables: [
      {
        title: 'Opções Rápidas para a Ceia',
        rows: [
          ...(!flags.noLactose ? [{ name: 'Iogurte Natural Desnatado', grams: '120 g', measureHint: '1 pote pequeno' }] : []),
          { name: 'Kiwi, Morango ou Mamão picado', grams: '120 g', measureHint: '1 taça pequena' },
          { name: 'Semente de Chia ou Linhaça', grams: '15 g', measureHint: '1 col. sopa' }
        ],
        notes: [
          'Se jantar tarde e já estiver satisfeito, pode pular a ceia tranquilamente.',
          'Chás sem cafeína (camomila, cidreira, hortelã, hibisco) estão liberados à vontade.'
        ]
      }
    ]
  };

  if (mealCount === 3) return [breakfastSheet, lunchSheet, dinnerSheet];
  if (mealCount === 5) return [breakfastSheet, morningSnackSheet, lunchSheet, afternoonSnackSheet, dinnerSheet];
  if (mealCount === 6) return [breakfastSheet, morningSnackSheet, lunchSheet, afternoonSnackSheet, dinnerSheet, supperSheet];
  return [breakfastSheet, lunchSheet, afternoonSnackSheet, dinnerSheet];
}

export function buildCompleteSubstitutionCatalog(
  evaluation: AssessmentRecord
): CompleteSubstitutionCatalogGroup[] {
  const flags = getAllergenFlags(evaluation);

  return [
    {
      title: '1. Folhas Verdes (Consumo Livre — Base de Volume)',
      subtitle: 'Use à vontade no almoço, jantar e até em lanches salgados para máxima saciedade com pouquíssimas calorias.',
      tone: 'forest',
      items: [
        'Alface crespa, americana, lisa ou roxa',
        'Rúcula, Agrião e Espinafre fresco',
        'Couve-manteiga (crua fininha ou refogada)',
        'Repolho verde ou roxo, Acelga e Chicória',
        'Almeirão, Escarola, Folha de mostarda e Taioba',
        'Temperos naturais livres: limão, vinagre, alho, ervas frescas, cúrcuma e orégano'
      ]
    },
    {
      title: '2. Verduras e Legumes Classe 1 (Alto Volume — 150g a 250g/refeição)',
      subtitle: 'Combine 2 a 3 opções diferentes por refeição — assados, no vapor, na airfryer, crus ou em sopas.',
      tone: 'green',
      items: [
        'Tomate, Pepino, Rabanete e Pimentão (verde, amarelo ou vermelho)',
        'Abobrinha, Chuchu, Berinjela, Quiabo e Jiló',
        'Brócolis, Couve-flor, Vagem e Aspargos',
        'Abóbora cabotiá / moranga, Cenoura e Beterraba',
        'Palmito, Cogumelos (champignon/shimeji) e Cebola assada'
      ]
    },
    {
      title: '3. Frutas Classe 1 (Leves & Refrescantes — Alterne Durante o Dia)',
      subtitle: 'Você pode escolher 1 fruta ou fazer salada de frutas somando o peso total indicado na refeição.',
      tone: 'green',
      items: [
        'Melancia, Melão, Morango, Acerola e Pitaya (altíssimo volume por caloria)',
        'Laranja, Tangerina (mexerica), Kiwi, Abacaxi e Maracujá (ótimas pós-almoço)',
        'Mamão papaia, Goiaba, Caju, Jambo e Cupuaçu',
        'Maçã, Pera, Pêssego e Ameixa fresca (práticas para bolsa/mochila)'
      ]
    },
    {
      title: '4. Carboidratos Classe 2 e Classe 3 (Energia Medida)',
      subtitle: 'Troque peso por peso dentro da mesma classe ou misture 2 opções somando o peso total indicado.',
      tone: 'red',
      items: [
        'Almoço/Jantar (Classe 2): Arroz branco, parboilizado ou integral · Feijão carioca, preto, fradinho ou branco',
        'Leguminosas extras (Classe 2): Lentilha, Grão-de-bico cozido e Ervilha fresca',
        'Raízes & Tubérculos (Classe 2): Batata inglesa, Batata-doce, Mandioquinha (baroa), Mandioca/Aipim, Inhame e Cará',
        ...(flags.noGluten
          ? ['Café/Lanches (Classe 3 — Sem Glúten): Tapioca, Cuscuz de milho, Aveia sem glúten, Banana, Pão sem glúten, Biscoito de arroz e Pipoca']
          : ['Café/Lanches (Classe 3): Pão francês, integral, sírio ou pita · Aveia em flocos · Tapioca · Cuscuz de milho · Banana · Pipoca leve'])
      ]
    },
    {
      title: '5. Proteínas Magras (Equivalência Direta — Massa Magra & Saciedade)',
      subtitle: 'Troque livremente respeitando o peso pronto listado na tabela de cada refeição.',
      tone: 'blue',
      items: [
        ...(!flags.isVegetarian
          ? [
              'Aves: Peito de frango grelhado, desfiado, assado ou sobrecoxa sem pele',
              'Carnes bovinas magras: Patinho (moído ou bife), Coxão mole, Músculo, Lagarto ou Alcatra limpa',
              ...(!flags.noFish ? ['Peixes: Tilápia, Merluza, Pescada, Linguado, Atum em água ou Sardinha drenada'] : []),
              ...(!flags.noPork ? ['Suínos magros: Lombo suíno ou Filé mignon suíno'] : [])
            ]
          : []),
        ...(!flags.noEggs ? ['Ovos: Ovos inteiros cozidos, mexidos, pochê, omelete com legumes ou Claras'] : []),
        ...(!flags.noLactose
          ? ['Lácteos proteicos: Iogurte natural/proteico, Queijo Cottage, Ricota, Minas Frescal e Whey Protein']
          : ['Proteínas vegetais: Tofu firme, Proteína de soja hidratada e Proteína vegetal em pó']),
        'Opções vegetais complementares: Tofu firme, Tempeh, Grão-de-bico, Lentilha e Proteína de soja'
      ]
    },
    {
      title: '6. Gorduras Boas (Porções Inteligentes — Controle Hormonal)',
      subtitle: 'Escolha 1 opção respeitando a quantidade — atenção às observações de troca com Abacate e Linhaça.',
      tone: 'slate',
      items: [
        'Azeite de oliva extravirgem (ideal cru sobre saladas e legumes)',
        'Abacate fresco (lembrete: ao usar abacate no café, reduza metade da Fruta Classe 1)',
        ...(!flags.noNuts ? ['Castanhas (pará, caju, nozes, amêndoas, avelã) e Sementes (abóbora, girassol, gergelim)'] : []),
        'Linhaça dourada/marrom triturada e Semente de Chia',
        ...(!flags.noPeanuts ? ['Amendoim torrado sem sal ou Pasta de amendoim integral (100% amendoim)'] : []),
        'Azeitonas verdes/pretas e Gema do ovo'
      ]
    }
  ];
}
