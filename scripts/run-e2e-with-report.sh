#!/bin/bash
# E2E Test Runner with JSON Report Output
# This script runs Playwright E2E tests and outputs a JSON report
# for use by the Paperclip E2E monitoring routine

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Output file for JSON report
REPORT_FILE="${PROJECT_DIR}/test-results.json"

echo "Starting E2E tests..."
echo "Project directory: $PROJECT_DIR"
echo "Report will be written to: $REPORT_FILE"

# Run Playwright tests with JSON reporter
# CI=true ensures consistent behavior
CI=true npx playwright test --reporter=json --output="$REPORT_FILE" 2>&1 || TEST_EXIT_CODE=$?

# Default exit code to 0 if tests passed
TEST_EXIT_CODE=${TEST_EXIT_CODE:-0}

# Parse results and create summary
if [ -f "$REPORT_FILE" ]; then
  echo ""
  echo "=== Test Results ==="

  # Extract summary using node (more reliable than jq on Windows)
  node -e "
    const fs = require('fs');
    try {
      const report = JSON.parse(fs.readFileSync('$REPORT_FILE', 'utf8'));
      const stats = report.stats || {};
      console.log('Total tests: ' + (stats.expected || 0));
      console.log('Passed: ' + ((stats.expected || 0) - (stats.unexpected || 0) - (stats.flaky || 0)));
      console.log('Failed: ' + (stats.unexpected || 0));
      console.log('Flaky: ' + (stats.flaky || 0));
      console.log('Skipped: ' + (stats.skipped || 0));
      console.log('Duration: ' + ((stats.duration || 0) / 1000) + 's');

      if (stats.unexpected > 0) {
        console.log('');
        console.log('=== Failed Tests ===');
        const suites = report.suites || [];
        function findFailures(suite, prefix = '') {
          const title = prefix ? prefix + ' > ' + suite.title : suite.title;
          for (const spec of suite.specs || []) {
            for (const test of spec.tests || []) {
              for (const result of test.results || []) {
                if (result.status === 'failed' || result.status === 'unexpected') {
                  console.log('- ' + title + ' > ' + spec.title);
                  if (result.error && result.error.message) {
                    console.log('  Error: ' + result.error.message.split('\\n')[0]);
                  }
                }
              }
            }
          }
          for (const child of suite.suites || []) {
            findFailures(child, title);
          }
        }
        for (const suite of suites) {
          findFailures(suite);
        }
      }
    } catch (e) {
      console.log('Could not parse test report: ' + e.message);
    }
  "

  echo ""
fi

exit $TEST_EXIT_CODE
