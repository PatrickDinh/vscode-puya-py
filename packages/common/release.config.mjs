export default {
  branches: [
    {
      name: 'main',
      prerelease: 'beta',
    },
    {
      name: 'do-not-delete',
    },
  ],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          {
            type: 'build',
            release: 'patch',
          },
          {
            type: 'chore',
            release: 'patch',
          },
          {
            type: 'docs',
            release: 'patch',
          },
        ],
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            {
              type: 'feat',
              section: 'Features',
            },
            {
              type: 'fix',
              section: 'Bug Fixes',
            },
            {
              type: 'build',
              section: 'Dependencies and Other Build Updates',
              hidden: false,
            },
          ],
        },
      },
    ],
    [
      'semantic-release-vsce',
      {
        packageVsix: true,
        publish: false,
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: [
          {
            path: '*.vsix',
          },
        ],
        successComment: false,
        failTitle: false,
      },
    ],
    'semantic-release-export-data',
  ],
  processCommits(commitsWithFilePaths) {
    return commitsWithFilePaths.filter((commitWithFilePath) => {
      return commitWithFilePath.filePaths.some(
        (filePath) => filePath.startsWith('packages/common/')
      )
    })
  },
}
