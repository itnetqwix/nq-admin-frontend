module.exports = {
  env: {
    node: true,
    es6: true,
    browser: true
  },
  parser: '@babel/eslint-parser',
  extends: ['next/core-web-vitals', 'prettier'],
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
    project: './jsconfig.json',
    ecmaFeatures: {
      jsx: true,
      modules: true,
      experimentalObjectRestSpread: true
    }
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    'react/display-name': 'off',
    '@next/next/no-img-element': 'off',
    'react/no-unescaped-entities': 'off',
    'import/no-anonymous-default-export': 'off',
    'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }]
  },
  overrides: [
    {
      files: ['src/pages/apps/**/*.{js,jsx}', 'src/features/**/*.{js,jsx}'],
      rules: {
        'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }]
      }
    },
    {
      files: ['src/pages/apps/**/index.{js,jsx}'],
      rules: {
        'max-lines': ['warn', { max: 180, skipBlankLines: true, skipComments: true }]
      }
    }
  ]
}
