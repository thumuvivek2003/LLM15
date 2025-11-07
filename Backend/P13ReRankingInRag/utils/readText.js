export function fromBufferToText(buf) {
    return Buffer.from(buf).toString('utf8').replace(/\r/g, '').replace(/\t/g, ' ').replace(/\n{3,}/g, '\n\n');
}