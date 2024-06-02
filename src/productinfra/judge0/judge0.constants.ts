import { Language } from '../../infra/prisma/generated';

// If the language is not inside, it means it's not supported
export const PRISMA_LANGUAGE_TO_JUDGE0_NAME_PREFIX = {
  [Language.C_PLUS_PLUS]: 'C++ (GCC',
  [Language.JAVA]: 'Java (',
  [Language.PYTHON]: 'Python (2',
  [Language.PYTHON_THREE]: 'Python (3',
  [Language.C]: 'C (GCC',
  [Language.C_SHARP]: 'C#',
  [Language.JAVASCRIPT]: 'JavaScript',
  [Language.RUBY]: 'Ruby',
  [Language.SWIFT]: 'Swift',
  [Language.GO]: 'Go',
  [Language.SCALA]: 'Scala',
  [Language.KOTLIN]: 'Kotlin',
  [Language.RUST]: 'Rust',
  [Language.PHP]: 'PHP',
  [Language.TYPESCRIPT]: 'TypeScript',
  // RACKET is not supported
  [Language.ERLANG]: 'Erlang',
  [Language.ELIXIR]: 'Elixir',
  [Language.DART]: 'Dart',
  // MY_SQL is not supported
  // MS_SQL_SERVER is not supported
  // ORACLE is not supported
  [Language.PANDAS]: 'Python (3', // We'll assume Pandas is just Python 3 for now
  // POSTGRESQL is not supported
  [Language.BASH]: 'Bash',
  // ADA is not supported
  // ALGOL_68 is not supported
  // APL is not supported
  [Language.COBOL]: 'COBOL',
  [Language.LISP]: 'Common Lisp',
  // CRYSTAL is not supported
  [Language.D]: 'D (DMD',
  [Language.F_SHARP]: 'F#',
  [Language.FORTRAN]: 'Fortran',
  // GERBIL is not supported
  [Language.HASKELL]: 'Haskell',
  // JULIA is not supported
  [Language.LUA]: 'Lua',
  // MODULA_2 is not supported
  // NIM is not supported
  [Language.OBJECTIVE_C]: 'Objective-C',
  [Language.OCAML]: 'OCaml',
  [Language.OCTAVE]: 'Octave',
  // ODIN is not supported
  [Language.PASCAL]: 'Pascal',
  [Language.PERL]: 'Perl',
  [Language.PROLOG]: 'Prolog',
  // SIMULA_67 is not supported
  // SMALLTALK is not supported
  // SNOBOL is not supported
  [Language.VISUAL_BASIC]: 'Visual Basic.Net',
  // ZIG is not supported
};

export const VERSION_NUMBER_REGEX = /\d+(\.\d+)+/;
export const VERSION_UPDATE_INTERVAL_MS = 3600000;
