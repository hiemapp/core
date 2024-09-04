import LanguageMessages, { LanguageId, NestedMessages } from '~/localization/LanguageMessages';

function registerModule(arg: any) {
    if(typeof arg === 'function') {
        arg = arg();
    }

    if(typeof arg.register === 'function') {
        return arg.register();
    }
}

function registerMessages(id: LanguageId, messages: NestedMessages) {
    const extModule = new LanguageMessages(id, messages);
    return registerModule(extModule);
}

export { registerModule, registerMessages };