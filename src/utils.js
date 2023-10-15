export const sliceIntoChunks = (arr, chunkSize) => {
  try {
    const result = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      const chunk = arr.slice(i, i + chunkSize);
      result.push(chunk);
    }
    return result;
  } catch (error) {
    console.log(error);
  }
};
