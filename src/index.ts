import Instagram from 'instagram-apish';
import {getTopPost, createImageFromPost, Post} from './redditGen';
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({path:'src/.env'});

const username = process.env.username;
const password = process.env.password;

interface IData {
    lastOpen: number,
    subreddits: [{
        r: string,
        tags: string
    }]
};

fs.readFile('./data.json', 'utf8', async (err, jsonString) => {
    let data: IData;

    if (err) {
        console.log("File read failed:", err);
        return;
    }

    data = JSON.parse(jsonString);


    if((Date.now()) - data.lastOpen > 1000*60*60*24){
        data.lastOpen = Date.now();

        fs.writeFile('./data.json',JSON.stringify(data), err => {
            if (err) {
                console.log('Error writing file', err);
            }
            else {
                console.log('Successfully wrote file');
            }
        })

        const instagram = await Instagram();
        await instagram.login(username ? username : '', password ? password : '');

        for(let i = 0; i < data.subreddits.length; i++){
            const post = await getTopPost(data.subreddits[i].r);
    
            await createImageFromPost(post, 'image.jpg')
                .then(mes => {
                    console.log(mes);
                    return instagram.upload('image.jpg', post.title + '\n .' + '\n .' + data.subreddits[i].tags);
                }).then(mes => {
                    console.log(mes);
                }).catch((err) => console.log(err));
        }

        await instagram.close();
    }else{
        console.log('already been run today');
    }
})