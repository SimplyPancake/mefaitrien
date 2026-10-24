export const formatQuantifier = (thing:number|null|undefined, single: string, mutliple: string, noOption: string) =>
{
    if (thing == null || thing == undefined) {
        return noOption;
    }

    return thing == 1 ? `1 ${single}` : `${thing} ${mutliple}`
}