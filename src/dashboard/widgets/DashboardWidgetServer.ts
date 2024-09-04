import express, { Express } from 'express';
import { Config } from '~/lib';
import Logger from '~/lib/Logger';
import DashboardWidget, { DashboardWidgetRenderOptions } from './DashboardWidget';
import { ExtensionController } from '~/extensions';

export default class DashboardWidgetServer {
    static app: Express;
    static logger: Logger;

    static start() {
        this.app = express();
        this.logger = new Logger({ label: this.name });
        
        const port: number = Config.get('system.dashboard.widgets.server.port');

        this.app.get('/widget', (req, res) => {
            if(typeof req.query.id !== 'string') {
                res.sendStatus(400);
                return;
            }

            const extensionModule = ExtensionController.findModuleOrFail(DashboardWidget, req.query.id);
            if(!extensionModule) {
                res.sendStatus(404);
                return;
            }

            let renderOptions: DashboardWidgetRenderOptions = {};
            try {
                renderOptions = JSON.parse(req.query.options as string);
            } catch(err) {}
            
            const content = extensionModule.$module.methods.render(renderOptions);
            res.send(content);
        })
        
        this.app.listen(port, () => {
            this.logger.info(`Listening at http://localhost:${port}.`);
        })
    }
}