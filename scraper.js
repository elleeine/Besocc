const puppeteer = require('puppeteer');
const { google } = require('googleapis');
const fs = require('fs');

const credentialsPath = 'credentials.json';
const spreadsheetId = '1jRjOsf7cSXLkF6_rB2e2-VOTD3UrTK431S1kzrU3a1E'; // Your spreadsheet ID
const sheetRange = 'Sheet1!A11'; // Start writing data from A11

// Google Sheets API authorization
async function authorizeGoogleSheets() {
    const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
}

// Write data to Google Sheets
async function writeToGoogleSheet(data) {
    const sheets = await authorizeGoogleSheets();
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: sheetRange,
        valueInputOption: 'RAW',
        resource: { values: data },
    });
}

// Scraping logic
async function scrapeWebsite() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        // Open the login page
        await page.goto('https://www.besoccer.com/login', { waitUntil: 'networkidle2' });

        // Handle cookie banner
        await page.waitForXPath('//button[@mode="primary"]');
        const [agreeButton] = await page.$x('//button[@mode="primary"]');
        await agreeButton.click();

        // Wait for login panel
        await page.waitForXPath('//div[@class="panel form login"]');

        // Enter credentials
        await page.type('#name', 'Apune');
        await page.type('#password', 'japune#83');
        await page.click('//div[@class="custom-button ph0"]');

        // Wait for successful login
        await page.waitForSelector('.panel-head li:nth-of-type(5) a');
        await page.click('.panel-head li:nth-of-type(5) a'); // Click the intended day

        // Mimic human-like scrolling
        let previousHeight;
        while (true) {
            previousHeight = await page.evaluate('document.body.scrollHeight');
            await page.evaluate('window.scrollBy(0, window.innerHeight)');
            await page.waitForTimeout(1000); // Wait to simulate human behavior

            const currentHeight = await page.evaluate('document.body.scrollHeight');
            if (currentHeight === previousHeight) break;
        }

        // Scroll back up and down again to ensure all content is loaded
        await page.evaluate('window.scrollTo(0, 0)');
        await page.waitForTimeout(2000); // Wait before scrolling back down
        await page.evaluate('window.scrollBy(0, window.innerHeight)');

        // Extract data based on JSON config
        const leagues = await page.evaluate(() => {
            const leagueElements = document.querySelectorAll('#tableMatches > div:not(:contains("Friendly"))');
            return Array.from(leagueElements).map(el => ({
                leagueName: el.querySelector('span.va-m')?.innerText || '',
                matches: Array.from(el.querySelectorAll('a.match-link:contains(":")')).map(link => link.href),
            }));
        });

        // Prepare data for Google Sheets
        const sheetData = [];
        leagues.forEach(league => {
            league.matches.forEach(match => {
                sheetData.push([league.leagueName, match]);
            });
        });

        await browser.close();
        return sheetData;

    } catch (error) {
        console.error('Error during scraping:', error);
        await browser.close();
        return [];
    }
}

// Main function to scrape and write data
(async () => {
    const data = await scrapeWebsite();
    if (data.length > 0) {
        await writeToGoogleSheet(data);
        console.log('Data successfully written to Google Sheets.');
    } else {
        console.log('No data to write.');
    }
})();
