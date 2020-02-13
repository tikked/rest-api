import * as express from 'express';
import { inject } from 'inversify';
import {
    controller,
    httpGet,
    interfaces,
    request,
    requestParam
} from 'inversify-express-utils';
import { distinctUntilChanged, map, skip, take, timeout } from 'rxjs/operators';
import { ApplicationEnvironment, Context } from 'gq';
import { ApplicationEnvironmentRepository } from 'gq';

@controller('/application-environment')
export class ApplicationEnvironmentController implements interfaces.Controller {

    constructor(
        @inject(ApplicationEnvironmentRepository) private repo: ApplicationEnvironmentRepository) {}

    @httpGet('/:id')
    private index(@requestParam('id') id: string): Promise<ApplicationEnvironment> {
        return this.repo.get(id).pipe(take(1)).toPromise();
    }

    @httpGet('/:id/feature-set')
    private featureSet(
        @requestParam('id') id: string,
        @request() req: express.Request): Promise<Iterable<string> | void> {
            const context = new Context(req.query);
            const wait = req.query.wait === 'true';
            return this.repo.get(id).pipe(
                map(appEnv => appEnv.getFeatureSet(context)),
                distinctUntilChanged((x, y) => eqSet(x, y)),
                skip(wait ? 1 : 0),
                wait ? timeout(60000) : map(x => x),
                take(1),
                map(x => [...x])
            ).toPromise().catch(err => {
                if (!wait) {
                    throw err;
                }
            });
    }
}

function eqSet<T>(as: Set<T>, bs: Set<T>) {
    if (as.size !== bs.size) return false;
    for (const a of as) if (!bs.has(a)) return false;
    return true;
}
