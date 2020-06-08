import fetch from 'node-fetch';
import capitalize from 'capitalize-sentence';

function memoize(method) {
  let cache = {};
  return async function() {
    let args = JSON.stringify(arguments);
    cache[args] = cache[args] || method.apply(this, arguments);
    return cache[args];
  };
}

export const normalizeDescription = (text) => {
  text = capitalize(text);
  if (text[text.length-1] !== ".") {
    text += ".";
  }
  return text;
};

export const getCauses = memoize(async () => {
  const causesResponse = await fetch('https://api.silobase.com/data/billionaireboard/causes');
  const causesData = (await causesResponse.json() || {}).data;

  // Safe for now to just get once, since there aren't that many causes
  return causesData;
});

export const extractCausesFromText = async (text) => {
  text = text.toLowerCase();

  const matchedCauses = [];

  const causes = await getCauses();

  const wordMatches = {
    "health": ["malaria", "pathogen", "vaccine", "medical", "pneumonia"],
    "technology": ["innovation"],
    "housing": ["apartment"],
    "science": ["laboratory", "scientific", "genetic"],
    "food": ["farmer", "agriculture", "agricultural"],
    "public services": ["sanitation"],
    "covid-19": ["sars2-cov2"]
  };

  for (let causeNameKey of Object.keys(wordMatches)) {
    for (let matchWord of wordMatches[causeNameKey]) {
      if (text.indexOf(matchWord.toLowerCase()) !== -1) {
        text += (' ' + causeNameKey.toLowerCase());
      }
    }
  }

  for (let cause of causes) {
    if (text.indexOf(cause.name.toLowerCase()) !== -1) {
      matchedCauses.push(cause);
    }
  }

  return matchedCauses.map(c => c.name);
};
