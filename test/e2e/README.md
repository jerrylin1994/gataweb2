# Cypress + WDIO
End to end tests are written using Cypress and WDIO. WDIO is used for test cases that cannot be done with Cypress

# Setup
### Install all required packages
```
npm install
```

### If needed, get access token required for the gmail apis (should already be included)


1. Download gmail client configuration file credentials.json by following step one of the guide for onelocalqa@gmail.com and name it "credentials.json"
https://developers.google.com/gmail/api/quickstart/nodejs

2. Follow the same step and download the configuration file for onelocalqa2@gmail.com and name the file "credentials2.json"

3. Run gmail-token.js which will save a token.json file with an access and refresh token for the first email
    ```
    node gmail-token.js
    ```

4. Repeat step 3 and generate the second token file for the second email

When you run gmail-token.js
1. Browse to the url provided in the command line
2. Log in to the google account to be used for testing (onelocalqa@gmail.com, onelocalqa2@gmail.com)
3. Copy the code and paste it into the command line prompt
4. Hit enter

# Running tests
## Setup
Before running cypress tests, two dotenv files `stg.env` and `prd.env` needs to be created under cypress/config folder with the following credentials
- INTERCOM_TOKEN
- TWILIO_TOKEN
- DASHBOARD_PASSWORD
- ADMIN_PASSWORD

These passwords needs to be filled into wdio.stg.conf.js file for WDIO.
1. twilio_auth_token
2. intercom.bearer

The DB url needs to be filled in in the db.js file under WDIO

## Cypress
- Tests can either be run using the Cypress testrunner UI or through terminal
### Through Cypress UI
Open all tests for staging env (Not recommended to run regression suite as the UI gets sluggish with lots of tests)
```
npm run cy:stg
```
Open smoke suite for staging env
```
npm run cy-open:stg-smoke
```
Open regression suite for staging env
```
npm run cy-open:stg-reg
```
Open public website suite for staging env
```
npm run cy-open:stg-site-smoke
```

### Through terminal
Run smoke suite for staging env with headless chrome (Recommended for regression suite)
```
npm run cy-run:stg-smoke
```
Run regression suite for staging env with headless chrome
```
npm run cy-run:stg-reg
```
Run public website suite for staging env with headless chrome
```
npm run cy-run:stg-site-smoke
```

### Percy - Delivery smoke test cases
- Delivery smoke tests need to be run separtly to execute percy tests
- Percy tests have to be executed through terminal

1. Set PERCY_TOKEN envirable (found through Percy dashboard) and set percy branch to local
    ```
    $ export PERCY_TOKEN=<your token here>
    $ export PERCY_BRANCH=local
    ```
2. run percy visual tests for each of the 3 delivery products using the following command
    ```
    npm run cy:stg-percy-delivery
    ```

## WDIO
### To run all tests on staging
```
wdio-run:stg-reg
```

# Reporting
## Cypress
There are 2 reports that are available after running tests through command line.
1. Mocha's spec report will automatically be generated after a test run and results will be displayed in the command line
2. Mocha's mochawesome report per spec file will automatically be generated after a test run. To be able to view the report and combine all the reports for each spec into a consolidated report, the following command needs to be run
    ```
    npm run report
    ```
    This will generate and auto open a html report which will also include the screenshots and videos of the failed tests.

    Note: the command above will delete individual spec reports so that next test run, the consolidated report will only include data from the new test run. If the above command is not run, the follow command will be needed to delete all the individual reports prior to a new test run
    ```
    npm run delete-reports
    ```
