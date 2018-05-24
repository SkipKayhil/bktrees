import json, csv, sys
import matplotlib.pyplot as plt


def main():
    HIGHEST_BK = 2084
    NUM_HUNDERED = HIGHEST_BK // 100 + 1
    output = {}
    stats = {}
    stats['count'] = [0 for x in range(NUM_HUNDERED)]

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
            if row[BIG_BK]:
                stats['count'][int(row[BK]) // 100] += 1
    stats['count'][20] = 100

    # verify data
    for bk in output:
        for little in output[bk]['children']:
            if output[little]['big'] != bk:
                print('ERROR: %s does not have %s as big' % (little, bk))
        big = output[bk]['big']
        if big != '' and bk not in output[big]['children']:
            print('ERROR: %s does not have %s as little' % (big, bk))

    # dump to json if path is provided
    if len(sys.argv) == 3:
        with open(sys.argv[2], 'w') as jsonfile:
            json.dump(output, jsonfile, sort_keys=True, separators=(',', ':'))

    # print stats
    for i in range(NUM_HUNDERED):
        print('%2dxx: %d' % (i, stats['count'][i]))

    # create bar chart
    [
        plt.annotate(
            "{:.0f}".format(rect.get_height()),
            (rect.get_x() + rect.get_width() / 2, rect.get_height()),
            xytext=(0, 5),
            textcoords="offset points",
            ha='center',
            va='bottom') for rect in plt.bar(
                range(NUM_HUNDERED), stats['count'], .8, color='blue')
    ]
    plt.xticks(
        range(NUM_HUNDERED), ['%2dxx' % x for x in range(NUM_HUNDERED)],
        rotation=-45)
    plt.gca().set_ylim([0, 100])

    plt.savefig("graph.svg")


if __name__ == '__main__':
    main()