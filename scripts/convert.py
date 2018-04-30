import json, csv, sys


def main():
    output = {}

    if len(sys.argv) < 2:
        print('ERROR: No .csv argument was passed in')
        exit()

    with open(sys.argv[1], newline='') as csvfile:
        reader = csv.reader(csvfile, delimiter=',', quotechar='"')
        header = next(reader)
        BK = header.index('BK')
        FIRST_NAME = header.index('First')
        LAST_NAME = header.index('Last')
        BIG_BK = header.index('Big BK')
        LITTLES = header.index('Littles')

        for row in reader:
            if row[FIRST_NAME] or row[LAST_NAME] or row[BIG_BK] or row[LITTLES]:
                output[row[BK]] = {
                    'id':
                    row[BK],
                    'name':
                    row[FIRST_NAME] + ' ' + row[LAST_NAME],
                    'big':
                    row[BIG_BK],
                    'children':
                    [bk.strip() for bk in row[LITTLES].split(',') if bk != '']
                }
        # print(output)

    # verify data
    for bk in output:
        for little in output[bk]['children']:
            if output[little]['big'] != bk:
                print('ERROR: %s does not have %s as big' % (little, bk))
        big = output[bk]['big']
        if big != '' and bk not in output[big]['children']:
            print('ERROR: %s does not have %s as little' % (big, bk))

    with open('NEW-archive.json', 'w') as jsonfile:
        json.dump(output, jsonfile, sort_keys=True, separators=(',', ':'))


if __name__ == '__main__':
    main()