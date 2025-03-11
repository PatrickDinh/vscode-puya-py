import * as path from 'path'
import * as Mocha from 'mocha'
import { glob } from 'glob'

// This function name is important, do not change it
export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
  })
  mocha.timeout(200_000)

  const testsRoot = path.resolve(__dirname, '../../../')

  return glob.glob('**/*.test.js', { cwd: testsRoot }).then(async (files) => {
    // Add files to the test suite
    files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)))

    try {
      // Run the mocha test
      await new Promise<void>((resolve, reject) => {
        mocha.run((failures) => {
          if (failures > 0) {
            reject(`${failures} tests failed.`)
          } else {
            resolve()
          }
        })
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      throw err
    }
  })
}
