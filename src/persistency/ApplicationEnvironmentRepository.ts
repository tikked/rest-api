import { inject, injectable } from 'inversify';
import { Observable, throwError } from 'rxjs';
import { filter, map, shareReplay } from 'rxjs/operators';
import { Coder, StreamFactory } from '.';
import { TYPES } from '../types';
import { ApplicationEnvironment } from 'gq/src/domain';
import { inputIsNotNullOrUndefined } from '../utility/Validators';

export type errorHandler = (err: Error) => void;

@injectable()
export class ApplicationEnvironmentRepository {

    private appEnvObs: Map<string, Observable<ApplicationEnvironment>>;

    constructor(
        @inject(TYPES.StreamFactory) private streamFactory: StreamFactory,
        @inject(TYPES.Coder) private coder: Coder,
        @inject(TYPES.ErrorHandler) private _errorHandler: errorHandler = console.error) {
            this.appEnvObs = new Map<string, Observable<ApplicationEnvironment>>();
    }

    public get(id: string): Observable<ApplicationEnvironment> {
        let res = this.appEnvObs.get(id);
        if (!res) {
            res = this.createObservable(id);
            this.appEnvObs.set(id, res);
        }
        return res;
    }

    private createObservable(id: string): Observable<ApplicationEnvironment> {
        try {
            return this.streamFactory.create(id).read().pipe(
                map((x, i) => this.decodeOrLog(x, i === 0)),
                filter(inputIsNotNullOrUndefined),
                shareReplay(1));
        } catch (err) {
            return throwError(err);
        }
    }

    private decodeOrLog(input: string, doThrow: boolean): ApplicationEnvironment | undefined {
        try {
            return this.coder.decode(input);
        } catch (e) {
            if (doThrow) throw e;
            this._errorHandler(e);
            return undefined;
        }
    }
}
