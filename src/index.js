const SYMBOLS = {
  1: "█",
  0: " ",
};

const zip = (a1, a2) => a1.map((v, i) => [v, a2[i]]);

const makeAutomataRuleDictionary = (rule) => {
  const indices = Array(8)
    .fill(0)
    .map((_, i) => 7 - i);

  return Object.fromEntries(
    zip(
      indices,
      indices.map((n) => ((rule & (2 << (n - 1))) > 0 ? 1 : 0))
    )
  );
};

const makeIsset = (space, maxWidth, maxHeight) => (x, y) => {
  if (x < 0 || x > maxWidth) return 0;
  if (y < 0 || y > maxHeight) return 0;

  const row = space[y];

  const byteIndex = Math.floor(x / 8);
  const closestByteBoundaryIndex = Math.floor(x / 8) * 8;
  const nthBit = 7 - (x - closestByteBoundaryIndex);
  const mask = 1 << nthBit;
  const val = row[byteIndex] & mask;
  return val === mask ? 1 : 0;
};

const makeSet = (space, maxWidth, maxHeight) => (x, y) => {
  if (x < 0 || x > maxWidth) return;
  if (y < 0 || y > maxHeight) return;

  const row = space[y];
  const byteIndex = Math.floor(x / 8);
  const closestByteBoundaryIndex = Math.floor(x / 8) * 8;
  const nthBit = 7 - (x - closestByteBoundaryIndex);
  const mask = 1 << nthBit;
  row[byteIndex] |= mask;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const start = async (bufWidth, rule = 126) => {
  const ruleDictionary = makeAutomataRuleDictionary(rule);

  const BUF_HEIGHT = 2;

  const space = Array(2)
    .fill(0)
    .map(() => new Uint8ClampedArray(Math.floor(bufWidth / 8)));

  const isset = makeIsset(space, bufWidth, BUF_HEIGHT);
  const set = makeSet(space, bufWidth, BUF_HEIGHT);

  // Initialize cellular automata by setting the middle bit
  set(Math.floor(bufWidth / 2), 0);

  const maskForThisSymbol = (x, y) => {
    const prevRowY = y - 1;

    return (
      (isset(x - 1, prevRowY) << 2) |
      (isset(x, prevRowY) << 1) |
      isset(x + 1, prevRowY)
    );
  };

  const shouldBeSet = (x, y) => ruleDictionary[maskForThisSymbol(x, y)];

  const print = (y) => {
    const output = [];
    for (let x = 0; x < bufWidth; x++) {
      output.push(SYMBOLS[isset(x, y)]);
    }
    console.log(output.join(""));
  };

  const HARD_CODED_INFINITE_BUFFER_Y = 1;

  const swapInfinitePrintBuffers = (space) => {
    space[0].set(space[1]);
    space[1].fill(0);
  };

  print(0);

  for (let y = 1; y < Number.MAX_SAFE_INTEGER; y++) {
    for (let x = 0; x < bufWidth; x++) {
      if (!shouldBeSet(x, HARD_CODED_INFINITE_BUFFER_Y)) continue;
      set(x, HARD_CODED_INFINITE_BUFFER_Y);
    }

    print(HARD_CODED_INFINITE_BUFFER_Y);
    swapInfinitePrintBuffers(space);
    await sleep(16);
  }
};

const printUsage = () => {
  console.log(`USAGE: ${process.argv[1]} WIDTH [RULE]`);
  console.log();
  console.log(`WIDTH    With in characters to generate`);
  console.log(
    `RULE     Cellular automata number to generate. Defaults to 126.`
  );
  console.log(
    `         Some interesting rules to try: ${[110, 126, 146, 150, 182].join(
      ", "
    )}`
  );
};

const DEFAULT_RULE = 126;
const width = parseInt(process.argv[2], 10);
const rule =
  process.argv.length === 4 ? parseInt(process.argv[3], 10) : DEFAULT_RULE;
if (
  isNaN(width) ||
  width < 0 ||
  width > Number.MAX_SAFE_INTEGER ||
  isNaN(rule)
) {
  printUsage();
  process.exit(1);
}

start(width, rule);
