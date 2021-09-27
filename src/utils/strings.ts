const SPLIT_CHAR = '\n'

export function splitLinesToFit(details: string, limit: number): string {
    // Section of the string before overflow limit
    if (details.length <= limit) {
        return details
    }

    const part_before_limit = details.substr(0, limit)

    const overflow_index = part_before_limit.lastIndexOf(" ")

    const part_before_split = details.substr(0, overflow_index)
    const part_after_split = details.slice(overflow_index + 1)

    console.log(part_after_split)

    return part_before_split + SPLIT_CHAR + splitLinesToFit(part_after_split, limit)
}
