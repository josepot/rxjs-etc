/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-etc
 */

import {
    ConnectableObservable,
    merge,
    Observable,
    Observer,
    of,
    zip
} from "rxjs";

import {
    concat,
    distinctUntilChanged,
    map,
    mapTo,
    publish,
    scan
} from "rxjs/operators";

export function zipPadded<T>(
    sources: Observable<T>[],
    padValue?: any
): Observable<T[]> {

    return Observable.create((observer: Observer<T[]>) => {

        const publishedSources = sources.map(
            source => source.pipe(publish()) as ConnectableObservable<T>
        );

        const indices = merge(...publishedSources.map(
            source => source.pipe(map((unused, index) => index))
        )).pipe(
            scan((max, index) => Math.max(max, index), 0),
            distinctUntilChanged(),
            publish()
        ) as ConnectableObservable<number>;

        const subscription = zip<T>(...publishedSources.map(
            source => source.pipe(concat(indices.pipe(mapTo(padValue))))
        )).subscribe(observer);

        subscription.add(indices.connect());
        publishedSources.forEach(
            source => subscription.add(source.connect())
        );
        return subscription;
    });
}
