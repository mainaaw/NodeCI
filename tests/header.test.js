const Page = require('./helpers/page');

let page;

beforeEach(async () => {
    page = await Page.build();
    await page.goto('http://localhost:3000');
});

afterEach(async () => {
   await page.close();
});

test('Header title confirmed',async () => {

    // const text = await page.$eval('a.brand-logo',el => el.innerHTML);
    const text = await page.getContentsOf('a.brand-logo');
    expect(text).toEqual('Blogster');
});

test('clicking login begins oauth flow', async () => {

    await page.click('.right a');
    const url = await page.url();

    //Assert value of base url redirect to google oauth
    expect(url).toMatch(/accounts\.google\.com/)
});

test('when signed in show logout button', async () => {

    await page.login();

    const text = await page.getContentsOf('a[href="/auth/logout"]');
    expect(text).toEqual("Logout");


});