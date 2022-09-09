import axios from 'axios';
import { parse } from 'json2csv';

enum Resources {
    saved,
    ratings
}

interface MovieDataParams {
    user: string,
    resource: Resources,
    token: string,
}

async function getMovieData(params: MovieDataParams) {
    const baseUrl = 'https://www.taste.io/api/users';
    let offset = 0;
    let limit = 50;
    let nextPoll = true;

    let results = [];

    while (nextPoll) {
        console.log(`Polling ${params.resource} for user ${params.user} offset: ${offset}, limit: ${limit}`);
        try {
            const response = await axios.get(`${baseUrl}/${params.user}/movies/${params.resource}`, {
                params: {
                    offset,
                    limit,
                },
                headers: {
                    Authorization: `Bearer ${params.token}`
                }
            });

            const parsedEntries = response.data.items
                .filter(item => item.category == 'movies')
                .map((item) => {
                    let convertedRating;
                    if (params.resource === Resources.ratings) {
                        switch (item?.user?.rating) {
                            case 1:
                                convertedRating = 1;
                                break;
                            case 2:
                                convertedRating = 4;
                                break;
                            case 3:
                                convertedRating = 7;
                                break;
                            case 4:
                                convertedRating = 10;
                                break;
                        }
                    }

                    const resultObj = {
                        Title: item.name,
                        Year: item.year,
                        Directors: item.directors.map(director => director.name).join(","),
                        Rating10: convertedRating ?? ''
                    }

                    if (params.resource === Resources.ratings) {
                        delete resultObj.Rating10;
                    }

                    return resultObj;
                });

                results.push(...parsedEntries);

            offset += limit;
            if (response.data.items.length < limit) {
                nextPoll = false;
            }
        } catch (error) {
            throw new  Error('Grab new token from Taste.io UI');
        }
    }

    return results;
}

(async function() {
    let fields = ['Title', 'Year', 'Directors'];
    const user = 'Taste.io User Name';
    const token = 'Need Instructions on how to get Token';

    const saved = await getMovieData({user, resource: Resources.saved, token});
    
    try {
        const csv = parse(saved, { fields });
        console.log(csv);
    } catch (error) {
        console.error(error);
    }
})();
