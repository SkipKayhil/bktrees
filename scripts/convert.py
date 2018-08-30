import json, csv, sys
import matplotlib.pyplot as plt


def main():
    HIGHEST_BK = 2084
    IGNORE_BKS = {"1859", "2000"}
    NUM_HUNDERED = HIGHEST_BK // 100 + 1

    color = lambda *args: tuple(c / 255. for c in args)
    LIGHT_GREEN = color(152, 223, 138)
    DARK_GREEN = color(44, 160, 44)

    output = {}
    stats = {"count": [0 for x in range(NUM_HUNDERED)]}

    if len(sys.argv) < 2:
        print("ERROR: No .csv argument was passed in")
        exit()

    with open(sys.argv[1], newline="") as csvfile:
        reader = csv.DictReader(csvfile, delimiter=",", quotechar='"')

        for row in reader:
            if row["First"] or row["Last"] or row["Big BK"] or row["Littles"]:
                output[row["BK"]] = {
                    "id": row["BK"],
                    "name": row["First"] + " " + row["Last"],
                    "big": row["Big BK"],
                    "children": [bk for bk in row["Littles"].split(", ") if bk],
                }
            if row["Big BK"] or row["BK"] in IGNORE_BKS:
                stats["count"][int(row["BK"]) // 100] += 1
    stats["count"][20] = 100

    # verify data
    for bk in output:
        for little in output[bk]["children"]:
            if output[little]["big"] != bk:
                print("ERROR: %s does not have %s as big" % (little, bk))
        big = output[bk]["big"]
        if big != "" and bk not in output[big]["children"]:
            print("ERROR: %s does not have %s as little" % (big, bk))

    # dump to json if path is provided
    if len(sys.argv) == 3:
        with open(sys.argv[2], "w") as jsonfile:
            json.dump(output, jsonfile, sort_keys=True, separators=(",", ":"))

    # print stats
    for i in range(NUM_HUNDERED):
        print("%2dxx: %d" % (i, stats["count"][i]))

    # create bar chart
    plt.figure(figsize=(12, 9))
    plt.ylim(0, 100)
    plt.xlim(-.5, NUM_HUNDERED - .5)
    plt.xticks(range(NUM_HUNDERED), ["%2dxx" % x for x in range(NUM_HUNDERED)])

    [
        plt.annotate(
            "{:.0f}".format(rect.get_height()),
            (rect.get_x() + rect.get_width() / 2, rect.get_height()),
            xytext=(0, 5),
            textcoords="offset points",
            ha="center",
            va="bottom",
        )
        for rect in plt.bar(
            range(NUM_HUNDERED),
            stats["count"],
            .8,
            color=[LIGHT_GREEN if x == 100 else DARK_GREEN for x in stats["count"]],
        )
    ]

    ax = plt.gca()
    ax.get_yaxis().set_visible(False)
    ax.spines["top"].set_visible(False)
    ax.spines["bottom"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_visible(False)

    plt.savefig("graph.svg", bbox_inches="tight")
    print("Chart saved to graph.svg!")


if __name__ == "__main__":
    main()
