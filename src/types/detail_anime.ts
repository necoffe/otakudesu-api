type genreType = {
    name: string,
    slug: string | undefined
};

type episodeType = {
    episode: string,
    slug: string | undefined
};

type urlType = {
    provider: string,
    url: string | undefined
};

type downloadType = {
    resolution: string,
    size: string,
    urls: urlType[]
};

type mirrorStreamType = {
    quality: string,
    provider: string,
    data_content: string
};

type resolvedMirrorType = {
    quality: string,
    provider: string,
    stream_url: string | null
};

export { 
    genreType,
    episodeType,
    urlType,
    downloadType,
    mirrorStreamType,
    resolvedMirrorType
};
