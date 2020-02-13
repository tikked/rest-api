import { Container } from 'inversify';
import { ApplicationEnvironmentRepository, Coder, StreamFactory, errorHandler } from 'gq';
import { FileStreamFactory } from 'gq';
import { JsonCoder } from 'gq';
import { TYPES } from 'gq';
import { join } from 'path'

export function createContainer(applicationEnvironmentRoot: string): Container {
    const container = new Container();
    container.bind<ApplicationEnvironmentRepository>(ApplicationEnvironmentRepository)
        .toSelf().inSingletonScope();
    container.bind<StreamFactory>(TYPES.StreamFactory).to(FileStreamFactory);
    container.bind<Coder>(TYPES.Coder).to(JsonCoder);
    container.bind<string>(TYPES.ApplicationEnvironmentRoot)
        .toConstantValue(join(__dirname, applicationEnvironmentRoot));
        container.bind<errorHandler>(TYPES.ErrorHandler).toConstantValue(console.error);
    return container;
}
