"use strict";
// Credit: Tsoding Channel -> https://youtube.com/watch?v=tm60fuF5v54
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = mostSimilar;
/**
 * Finds the most similar strings to a given input from a list of options.
 * This function uses the Levenshtein distance algorithm to calculate similarity.
 *
 * @param input - The input string to compare against the options.
 * @param options - A list of strings to compare with the input.
 * @returns A list of strings from `options` that are most similar to the input (Levenshtein distance <= 3).
 */
function mostSimilar(input, options) {
    /**
     * Calculates the Levenshtein distance between two strings.
     * The Levenshtein distance is the minimum number of single-character edits (insertions, deletions, or substitutions)
     * required to change one string into the other.
     * Reference: https://en.wikipedia.org/wiki/Levenshtein_distance
     *
     * @param word1 - The first string.
     * @param word2 - The second string.
     * @returns The Levenshtein distance between `word1` and `word2`.
     */
    const distance = (word1, word2) => {
        // Initialize a matrix to store distances between substrings.
        const distances = new Array(word1.length + 1)
            .fill(0)
            .map(() => new Array(word2.length + 1).fill(0));
        // Initialize a matrix to store actions (0 = ignore, 1 = add, 2 = remove).
        const actions = new Array(word1.length + 1)
            .fill(0)
            .map(() => new Array(word2.length + 1).fill(0));
        // Fill the first row with the cost of adding characters.
        for (let i = 1; i < word2.length + 1; i++) {
            distances[0][i] = i;
            actions[0][i] = 1; // 1 = add
        }
        // Fill the first column with the cost of removing characters.
        for (let j = 1; j < word1.length + 1; j++) {
            distances[j][0] = j;
            actions[j][0] = 2; // 2 = remove
        }
        // Fill the rest of the matrix.
        for (let i = 1; i < word1.length + 1; i++) {
            for (let j = 1; j < word2.length + 1; j++) {
                // If the characters match, no cost is incurred.
                if (word1[i - 1] === word2[j - 1]) {
                    distances[i][j] = distances[i - 1][j - 1];
                    actions[i][j] = 0; // 0 = ignore
                    continue;
                }
                // Calculate the cost of removing or adding a character.
                const remove = distances[i - 1][j];
                const add = distances[i][j - 1];
                // Choose the minimum cost operation.
                distances[i][j] = remove;
                actions[i][j] = 2; // 2 = remove
                if (distances[i][j] > add) {
                    distances[i][j] = add;
                    actions[i][j] = 1; // 1 = add
                }
                // Increment the cost by 1 for the chosen operation.
                distances[i][j] += 1;
            }
        }
        // Return the Levenshtein distance between the two words.
        return distances[word1.length][word2.length];
    };
    // Calculate the Levenshtein distance for each option and store it in a sorted list.
    let sorted = [];
    for (const word of options) {
        sorted.push([distance(input, word), word]);
    }
    // Sort the list by distance (ascending order).
    sorted.sort((a, b) => a[0] - b[0]);
    // Filter and return options with a Levenshtein distance of 3 or less.
    return sorted.filter(([dist]) => dist <= 3).map(([, word]) => word);
}
