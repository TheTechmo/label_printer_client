const SPLIT_CHAR = '\n'

// Oh this fuck this fuck me god my brain hurt every second of making this I hate creating these fucking algorithm things
export function splitLinesToFit(details: string, limit: number): string {
    // If the string is under the char limit, return as is
    if (details.length <= limit) {
        // Yay I remembered to make an exit case go me
        return details
    }

    // Get the part before the limit
    const part_before_limit = details.substr(0, limit)

    // Find the nearest space in that part
    const overflow_index = part_before_limit.lastIndexOf(" ")

    // Split that part into the parts on either side of the space
    const part_before_split = details.substr(0, overflow_index)
    const part_after_split = details.slice(overflow_index + 1)

    // You saw nothing....
    // console.log(part_after_split)

    // Return the part before the space plus the split char (usually \n), then rinse and repeat with the other part
    return part_before_split + SPLIT_CHAR + splitLinesToFit(part_after_split, limit)
}
