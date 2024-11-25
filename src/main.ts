import ky, { Options } from 'ky';
import { mkConfig, generateCsv, asString } from "export-to-csv";
import { writeFile } from "node:fs";
import { Buffer } from "node:buffer";

import dotenv from 'dotenv';
dotenv.config();


const convertToFlatObject = (obj: any) => {
    const flatObject: any = {};
    for (const key in obj) {
        if (typeof obj[key] === "object") {
            const flatObj = convertToFlatObject(obj[key]);
            for (const flatKey in flatObj) {
                flatObject[`${key}.${flatKey}`] = flatObj[flatKey];
            }
        } else {
            flatObject[key] = obj[key];
        }
    }
    return flatObject;
}

(async () => {

    const { bearer, customer_url } = process.env;

    const options: any = {
        headers: {
            Authorization: `Bearer ${bearer}`,
        },
        searchParams: {
            page: 1,
            show_all: true,
            status: 'active'
        },
    };

    const subs: any = await ky.get(customer_url!, options).json();
    // This will return count = the number of all items
    // results = 12 result items at max

    let results :any[] = subs.results.map((sub: any) => convertToFlatObject(sub));

    while (results.length < subs.count) {
        console.log(`Fetching page ${options.searchParams.page + 1}...`);
        options.searchParams.page++;
        const data: any = await ky.get(customer_url!, options).json();
        results = results.concat(data.results.map((sub: any) => convertToFlatObject(sub)));
        
    }

    console.log(results[0]);

    const csvConfig = mkConfig({ useKeysAsHeaders: true });
    const csv = generateCsv(csvConfig)(results);
    const filename = `${csvConfig.filename}.csv`;
    const csvBuffer = new Uint8Array(Buffer.from(asString(csv)));

    writeFile(filename, csvBuffer, (err) => {
        if (err) throw err;
        console.log("file saved: ", filename);
      });



})();
