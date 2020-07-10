import fetch from "node-fetch";
import fs from "fs";
import { createCanvas, loadImage } from "canvas";

interface Post {
    imageUrl: string,
    title: string,
    width: number,
    height: number
}

const getTopPost = async (subreddit: string) => {
    const data = await fetch(`https://www.reddit.com/r/${subreddit}/top/.json?t=day`)
        .then(res => res.json())
        .then(data => data)
        .catch((err) => console.log(err));

    let index = 0;

    for(let i = 0; i < data.data.children.length; i++){
        if(data.data.children[i].data.post_hint == "image"){
            index = i;
            break;
        }
    }
        
    const imageUrl = data.data.children[index].data.url_overridden_by_dest;
    const width = data.data.children[index].data.preview.images[0].source.width;
    const height = data.data.children[index].data.preview.images[0].source.height;
    const title = data.data.children[index].data.title;

    return({
        imageUrl: imageUrl,
        width: width,
        height: height,
        title: title,
    })
}

const createImageFromPost = async (post: Post, outPath: string) => {
    const textPadding = 10;
    const fontSize = post.width/15;
    
    const canvas = createCanvas(post.width, post.height);
    const ctx = canvas.getContext('2d');

    ctx.font = `${fontSize}px arial`;

    const words = post.title.split(' ');
    let line: string[] = [];
    line.push('');

    for(let i = 0; i < words.length; i++) {
        let testLine = line[line.length-1] + words[i] + ' ';
        let testWidth = ctx.measureText(testLine + (words[i+1] ? words[i+1]: '')).width+ 2*textPadding;

        if (testWidth > canvas.width && i > 0 && i <= words.length-2) {
            line.push('');
        }else {
            line[line.length-1] = testLine;
        }
    }

    canvas.height = post.height + line.length * fontSize + 2*textPadding;

    let leftPadding = 0;

    if(canvas.height == canvas.width)
        canvas.height ++

    if(canvas.height * (4/5) > canvas.width){
        leftPadding = (Math.floor(canvas.height * (4/5)) - canvas.width)/2;
        canvas.width = Math.floor(canvas.height * (4/5));
    }

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#000';

    for(let i = 0; i < line.length; i++){
        ctx.font = `${fontSize}px arial`;
        ctx.fillText(line[i], textPadding+leftPadding, i * fontSize + (fontSize*0.8) + textPadding);
    }
    
    const path = await loadImage(post.imageUrl)
        .then((image) => {
            ctx.drawImage(image, leftPadding, line.length * fontSize + 2*textPadding, post.width, post.height)
            let image64 = canvas.toDataURL().replace(/^data:image\/\w+;base64,/, "");
            let buffer = new Buffer(image64, 'base64');
            fs.writeFile(outPath, buffer, () => {
                console.log('done')
            });
        }).catch((err) => console.log(err));
}

export {getTopPost, createImageFromPost, Post};